/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from "events";
import { getContainer, IGetContainerService } from "@fluid-experimental/get-container";
import { Container } from "@fluidframework/container-loader";
import { IChannelFactory } from "@fluidframework/datastore-definitions";
import { NamedFluidDataStoreRegistryEntry } from "@fluidframework/runtime-definitions";
import {
    DOProviderContainerRuntimeFactory,
    RootDataObject,
} from "./containerCode";
import {
    isSharedObjectClass,
    isDataObjectClass,
} from "./utils";
import {
    ContainerConfig,
    DataObjectClass,
    FluidObjectClass,
} from "./types";
import { IFluidLoadable } from "@fluidframework/core-interfaces";

export class FluidContainer extends EventEmitter implements Pick<Container, "audience" | "clientId"> {
    private readonly types: Set<string>;

    private readonly container: Container;

    public readonly audience: Container["audience"];

    public constructor(
        container: Container, // we anticipate using this later, e.g. for Audience
        namedRegistryEntries: NamedFluidDataStoreRegistryEntry[],
        private readonly rootDataObject: RootDataObject,
        public readonly createNew: boolean) {
            super();
            this.types = new Set();
            namedRegistryEntries.forEach((value: NamedFluidDataStoreRegistryEntry) => {
                const type = value[0];
                if (this.types.has(type)) {
                    throw new Error(`Multiple DataObjects share the same type identifier ${value}`);
                }
                this.types.add(type);
            });
            this.audience = container.audience;
            this.container = container;
            container.on("connected", (id: string) =>  this.emit("connected", id));
        }

    public get clientId() {
        return this.container.clientId;
    }

    public async create<T extends IFluidLoadable>(objectClass: FluidObjectClass) {
        // This is a runtime check to ensure the developer doesn't try to create something they have not defined in the config
        const type = isDataObjectClass(objectClass) ? objectClass.factory.type : objectClass.getFactory().type;
        if (!this.types.has(type)) {
            throw new Error(
                `Trying to create an Object with type ${type} that was not defined as a dataType in the Container Config`);
        }

        return this.rootDataObject.create<T>(objectClass);
    }

    public async get<T extends IFluidLoadable>(id: string) {
        return this.rootDataObject.get<T>(id);
    }

    public delete(id: string) {
        this.rootDataObject.delete(id)
    }
}

/**
 * FluidInstance provides the ability to have a Fluid object with a specific backing server outside of the
 * global context.
 */
export class FluidInstance {
    private readonly containerService: IGetContainerService;

    public constructor(getContainerService: IGetContainerService) {
        // This check is for non-typescript usages
        if (getContainerService === undefined) {
            throw new Error("Fluid cannot be initialized without a ContainerService");
        }

        this.containerService = getContainerService;
    }

    public async createContainer(id: string, config: ContainerConfig): Promise<FluidContainer> {
        const [dataObjects, sharedObjects] = this.parseDataObjectsFromSharedObjects(config);
        const registryEntries = this.getRegistryEntries(dataObjects);
        const container = await getContainer(
            this.containerService,
            id,
            new DOProviderContainerRuntimeFactory(registryEntries, sharedObjects, config.initialObjects),
            true, /* createNew */
        );
        const rootDataObject = (await container.request({ url: "/" })).value;
        return new FluidContainer(container, registryEntries, rootDataObject, true /* createNew */);
    }

    public async getContainer(id: string, config: ContainerConfig): Promise<FluidContainer> {
        const [dataObjects, sharedObjects] = this.parseDataObjectsFromSharedObjects(config);
        const registryEntries = this.getRegistryEntries(dataObjects);
        const container = await getContainer(
            this.containerService,
            id,
            new DOProviderContainerRuntimeFactory(registryEntries, sharedObjects),
            false, /* createNew */
        );
        const rootDataObject = (await container.request({ url: "/" })).value;
        return new FluidContainer(container, registryEntries, rootDataObject, false /* createNew */);
    }

    private getRegistryEntries(dataObjects: DataObjectClass[]) {
        const dataObjectClassToRegistryEntry = (
            dataObjectClass: DataObjectClass): NamedFluidDataStoreRegistryEntry =>
            [dataObjectClass.factory.type, Promise.resolve(dataObjectClass.factory)];

        return dataObjects.map(dataObjectClassToRegistryEntry);
    }

    private parseDataObjectsFromSharedObjects(config: ContainerConfig): [DataObjectClass[], IChannelFactory[]] {
        const dataObjects: DataObjectClass[] = [];
        const sharedObjects: IChannelFactory[] = [];
        for (const obj of config.dataTypes) {
            if(isSharedObjectClass(obj)){
                sharedObjects.push(obj.getFactory());
            } else if (isDataObjectClass(obj)) {
                dataObjects.push(obj);
            } else {
                throw new Error(`Entry is neither a DataObject or a SharedObject`);
            }
        }

        if (dataObjects.length === 0 && sharedObjects.length === 0) {
            throw new Error("Container cannot be initialized without any DataTypes");
        }

        return [dataObjects, sharedObjects]
    }


}

/**
 * Singular global instance that lets the developer define the Fluid server across all instances of Containers.
 */
let globalFluid: FluidInstance | undefined;
export const Fluid = {
    init(getContainerService: IGetContainerService) {
        if (globalFluid) {
            throw new Error("Fluid cannot be initialized more than once");
        }
        globalFluid = new FluidInstance(getContainerService);
    },
    async createContainer(
        id: string, config: ContainerConfig): Promise<FluidContainer> {
        if (!globalFluid) {
            throw new Error("Fluid has not been properly initialized before attempting to create a container");
        }
        return globalFluid.createContainer(id, config);
    },
    async getContainer(
        id: string, config: ContainerConfig): Promise<FluidContainer> {
        if (!globalFluid) {
            throw new Error("Fluid has not been properly initialized before attempting to get a container");
        }
        return globalFluid.getContainer(id, config);
    },
};
