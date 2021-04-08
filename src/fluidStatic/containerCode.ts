/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BaseContainerRuntimeFactory,
    DataObject,
    DataObjectFactory,
    defaultRouteRequestHandler,
} from "@fluidframework/aqueduct";
import { IContainerRuntime } from "@fluidframework/container-runtime-definitions";
import { IFluidHandle, IFluidLoadable } from "@fluidframework/core-interfaces";
import { IChannelFactory } from "@fluidframework/datastore-definitions";
import { NamedFluidDataStoreRegistryEntry } from "@fluidframework/runtime-definitions";
import { requestFluidObject } from "@fluidframework/runtime-utils";
import { FluidContainer } from "./FluidStatic";
import {
    DataObjectClass,
    FluidObjectClass,
    FluidObjectClassCollection,
    SharedObjectClass,
    InitialObjects,
    FluidLoadableRecord,
} from "./types";

import { isSharedObjectClass, isDataObjectClass } from "./utils";

export class RootDataObject extends DataObject<object, { initialObjects: FluidObjectClassCollection }> implements FluidContainer {
    private initialObjectsDirKey = "initial-objects-key";
    private connectedHandler = (id: string) =>  this.emit("connected", id);

    private get initialObjectsDir() {
        const dir = this.root.getSubDirectory(this.initialObjectsDirKey);
        if (dir === undefined) {
            throw new Error("InitialObjects sub-directory was not initialized")
        }
        return dir;
    }

    protected async initializingFirstTime(props: { initialObjects: FluidObjectClassCollection }) {
        this.root.createSubDirectory(this.initialObjectsDirKey);

        // Create initial objects provided by the developer
        const initialObjectsP: Promise<void>[] = [];
        Object.entries(props.initialObjects).forEach(([id, dataObjectClass]) => {
            const createObject = async() => {
                const obj = await this.create(dataObjectClass);
                this.initialObjectsDir.set(id, obj);
            };
            initialObjectsP.push(createObject());
        });

        await Promise.all(initialObjectsP);
    }
    
    protected async hasInitialized() {
        this.runtime.on("connected", this.connectedHandler);
    }

    public dispose() {
        // remove our listeners and continue disposing
        this.runtime.off("connected", this.connectedHandler);
        super.dispose();
    }

    public get audience() {
        return this.context.getAudience();
    }

    public get clientId() {
        return this.context.clientId;
    }

    /**
     * Dynamic way to create new IFluidLoadable
     */
    public async create<T extends IFluidLoadable>(objectClass: FluidObjectClass): Promise<T> {
        if (isDataObjectClass(objectClass)) {
            return this.createDataObject<T>(objectClass);
        } else if (isSharedObjectClass(objectClass)) {
            return this.createSharedObject<T>(objectClass);
        }

        throw new Error("Could not create new Fluid object because an unknown object was passed");
    }

    public get initialObjects(): InitialObjects<any, FluidLoadableRecord<any>> {
        const mapEntries = ([key, handle]: [string, IFluidHandle]) => {
            return [key, async () => handle.get()];
        }
        const entries = Array.from(this.initialObjectsDir.entries()).map(mapEntries);
        return Object.fromEntries(entries);
    }

    public async initialObject<T extends IFluidLoadable>(id: string): Promise<T> {
        if (!this.initialObjectsDir.has(id)) {
            // Maybe just return undefined here?
            throw new Error(`Could not get Fluid object with id:[${id}] because it does not exist`);
            
        }
    
        const handle = await this.initialObjectsDir.wait<IFluidHandle<T>>(id);
        return handle.get();
    }

    private async createDataObject<T extends IFluidLoadable>(dataObjectClass: DataObjectClass): Promise<T> {
        const factory = dataObjectClass.factory;
        const packagePath = [...this.context.packagePath, factory.type];
        const router = await this.context.containerRuntime.createDataStore(packagePath);
        return requestFluidObject<T>(router, "/");
    }

    private createSharedObject<T extends IFluidLoadable>(
        sharedObjectClass: SharedObjectClass,
    ): T {
        const factory = sharedObjectClass.getFactory();
        const obj = this.runtime.createChannel(undefined, factory.type);
        return obj as unknown as T;
    }
}

const rootDataStoreId = "rootDOId";
/**
 * The DOProviderContainerRuntimeFactory is the container code for our scenario.
 *
 * By including the createRequestHandler, we can create any droplet types we include in the registry on-demand.
 * These can then be retrieved via container.request("/dataObjectId").
 */
export class DOProviderContainerRuntimeFactory extends BaseContainerRuntimeFactory {
    private readonly rootDataObjectFactory; // type is DataObjectFactory
    private readonly initialObjects: FluidObjectClassCollection;
    constructor(
        registryEntries: NamedFluidDataStoreRegistryEntry[],
        sharedObjects: IChannelFactory[],
        initialObjects: FluidObjectClassCollection = {},
    ) {
        const rootDataObjectFactory = new DataObjectFactory<RootDataObject, object, { initialObjects: FluidObjectClassCollection }>(
            "rootDO",
            RootDataObject,
            sharedObjects,
            {},
            registryEntries,
        );
        super([rootDataObjectFactory.registryEntry], [], [defaultRouteRequestHandler(rootDataStoreId)]);
        this.rootDataObjectFactory = rootDataObjectFactory;
        this.initialObjects = initialObjects;
    }

    protected async containerInitializingFirstTime(runtime: IContainerRuntime) {
        await this.rootDataObjectFactory.createRootInstance(rootDataStoreId, runtime, { initialObjects: this.initialObjects });
    }
}
