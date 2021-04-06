import { IFluidDataStoreFactory } from "@fluidframework/runtime-definitions";
import { IChannelFactory } from "@fluidframework/datastore-definitions";

export type FluidObjectClassCollection = Record<string, FluidObjectClass>;

export type FluidObjectClass = DataObjectClass | SharedObjectClass;

export type DataObjectClass = {
    readonly factory: IFluidDataStoreFactory;
}

export type SharedObjectClass = {
    readonly getFactory: () => IChannelFactory;
}

export type ContainerConfig<T extends string = string> = {
    name: T;
    dataTypes: FluidObjectClass[];
    /**
     * initialDataObjects defines dataObjects that will be created when the Container
     * is first created. It uses the key as the id and the value and the DataObject to create.
     *
     * In the example below two DataObjects will be created when the Container is first
     * created. One with id "foo1" that will return a `Foo` DataObject and the other with
     * id "bar2" that will return a `Bar` DataObject.
     *
     * ```
     * {
     *   foo1: Foo,
     *   bar2: Bar,
     * }
     * ```
     *
     * To get these DataObjects, call `container.getDataObject` passing in one of the ids.
     */
    initialObjects?: FluidObjectClassCollection;
}