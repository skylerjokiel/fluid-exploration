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
} from "./types";

import { isSharedObjectClass, isDataObjectClass } from "./utils";

export class RootDataObject extends DataObject<object, { initialObjects: FluidObjectClassCollection }> implements FluidContainer {
    private dataObjectDirKey = "data-objects";
    private sharedObjectDirKey = "shared-objects";
    private connectedHandler = (id: string) =>  this.emit("connected", id);

    private get dataObjectDir() {
        const dir = this.root.getSubDirectory(this.dataObjectDirKey);
        if (dir === undefined) {
            throw new Error("DataObject sub-directory was not initialized")
        }
        return dir;
    }

    private get sharedObjectDir() {
        const dir = this.root.getSubDirectory(this.sharedObjectDirKey);
        if (dir === undefined) {
            throw new Error("SharedObject sub-directory was not initialized")
        }
        return dir;
    }

    protected async initializingFirstTime(props: { initialObjects: FluidObjectClassCollection }) {
        this.root.createSubDirectory(this.dataObjectDirKey);
        this.root.createSubDirectory(this.sharedObjectDirKey);

        // If the developer provides static objects to be created on Container create we will create them
        const initialObjectsP: Promise<[IFluidLoadable, string]>[] = [];
        Object.entries(props.initialObjects).forEach(([id, dataObjectClass]) => {
            // We want to ideally only create initial data objects attached
            initialObjectsP.push(this.createInternal(dataObjectClass, id, false));
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

    public async create<T extends IFluidLoadable>(objectClass: FluidObjectClass): Promise<T> {
        // TODO: should use UUId
        const [obj] = await this.createInternal<T>(objectClass, Date.now().toString(), true);
        return obj;
    }

    // public get initialObjects(): [string, IFluidLoadable][]{
    //     return [...Array.from(this.dataObjectDir.entries()), ...Array.from(this.sharedObjectDir.entries())];
    // }

    public get initialObjects(): Record<string, IFluidHandle>{
        return Object.assign(Object.fromEntries(this.dataObjectDir.entries()), Object.fromEntries(this.sharedObjectDir.entries()));
    }


    public async get<T extends IFluidLoadable>(id: string): Promise<T> {
        if (this.dataObjectDir.has(id)) {
            return this.getDataObject<T>(id);
        } else if (this.sharedObjectDir.has(id)) {
            return this.getSharedObject<T>(id);
        }

        // Maybe just return undefined here?
        throw new Error(`Could not get Fluid object with id:[${id}] because it does not exist`);
    }

    public delete(id: string): void {
        this.dataObjectDir.delete(id) ?? this.sharedObjectDir.delete(id);
    }

    private async createInternal<T extends IFluidLoadable>(objectClass: FluidObjectClass, id: string, detached: boolean): Promise<[T, string]> {
        if (isDataObjectClass(objectClass)) {
            return this.createDataObject<T>(objectClass, id, detached);
        } else if (isSharedObjectClass(objectClass)) {
            return this.createSharedObject<T>(objectClass, id, detached);
        }

        throw new Error("Could not create new Fluid object because an unknown object was passed");
    }

    private async createDataObject<T extends IFluidLoadable>(
        dataObjectClass: DataObjectClass,
        id: string,
        detached: boolean,
    ): Promise<[T, string]> {
        const factory = dataObjectClass.factory;
        const packagePath = [...this.context.packagePath, factory.type];
        const router = await this.context.containerRuntime.createDataStore(packagePath);
        const object = await requestFluidObject<T>(router, "/");
        if (!detached) {
            this.dataObjectDir.set(id, object.handle);
        }
        return [object, id];
    }

    private async getDataObject<T extends IFluidLoadable>(id: string) {
        const handle = await this.dataObjectDir.wait<IFluidHandle<T>>(id);
        return handle.get();
    }

    private createSharedObject<T extends IFluidLoadable>(
        sharedObjectClass: SharedObjectClass,
        id: string,
        detached: boolean,
    ): [T, string] {
        const factory = sharedObjectClass.getFactory();
        const obj = this.runtime.createChannel(undefined, factory.type);
        if (!detached) {
            this.sharedObjectDir.set(id, obj.handle);
        }
        return [obj as unknown as T, id];
    }

    private async getSharedObject<T extends IFluidLoadable>(id: string) {
        const handle = await this.sharedObjectDir.wait<IFluidHandle<T>>(id);
        return handle.get();
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
