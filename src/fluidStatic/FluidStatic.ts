/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { getContainer, IGetContainerService } from "@fluid-experimental/get-container";
import { Container } from "@fluidframework/container-loader";
import { IChannelFactory } from "@fluidframework/datastore-definitions";
import { NamedFluidDataStoreRegistryEntry } from "@fluidframework/runtime-definitions";
import {
    DOProviderContainerRuntimeFactory,
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
import { IEvent, IEventProvider } from "@fluidframework/common-definitions";

export interface IFluidContainerEvents extends IEvent {
    (event: "connected", listener: (clientId: string) => void): any;
}

export interface FluidContainer extends Pick<Container, "audience" | "clientId">, IEventProvider<IFluidContainerEvents> {
    initialObjects: Record<string, <T extends IFluidLoadable>() => Promise<T>>;
    create<T extends IFluidLoadable>(objectClass: FluidObjectClass): Promise<T>;
    initialObject<T extends IFluidLoadable>(id: string): Promise<T>;
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
        return rootDataObject as FluidContainer;
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
        return rootDataObject as FluidContainer;
    }

    private getRegistryEntries(dataObjects: DataObjectClass[]) {
        const dataObjectClassToRegistryEntry = (
            dataObjectClass: DataObjectClass): NamedFluidDataStoreRegistryEntry =>
            [dataObjectClass.factory.type, Promise.resolve(dataObjectClass.factory)];

        return dataObjects.map(dataObjectClassToRegistryEntry);
    }

    private parseDataObjectsFromSharedObjects(config: ContainerConfig): [DataObjectClass[], IChannelFactory[]] {
        const dataObjects: Set<DataObjectClass> = new Set();
        const sharedObjects: Set<IChannelFactory> = new Set();

        const tryAddObject = (obj: FluidObjectClass) => {
            if(isSharedObjectClass(obj)){
                sharedObjects.add(obj.getFactory());
            } else if (isDataObjectClass(obj)) {
                dataObjects.add(obj);
            } else {
                throw new Error(`Entry is neither a DataObject or a SharedObject`);
            }
        }

        // Add the object types that will be initialized
        for (const key in config.initialObjects) {
            tryAddObject(config.initialObjects[key]);
        }

        // If there are dynamic object types we will add them now
        if (config.dynamicObjectTypes) {
            for (const obj of config.dynamicObjectTypes) {
                tryAddObject(obj);
            }
        }

        if (dataObjects.size === 0 && sharedObjects.size === 0) {
            throw new Error("Container cannot be initialized without any DataTypes");
        }

        return [Array.from(dataObjects), Array.from(sharedObjects)]
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
