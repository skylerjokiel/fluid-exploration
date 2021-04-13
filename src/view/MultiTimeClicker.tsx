
import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { IFluidHandle, IFluidLoadable } from "@fluidframework/core-interfaces";
import { SharedMap } from "@fluidframework/map";
import React from "react";

import { ContainerDefinition } from "../utils/types";
import { FluidContext } from "../utils/FluidContext";
import { useSharedMap } from "../utils/useDataObject";

export const MultiTimeClickerContainerDefinition: ContainerDefinition = {
    name: "multi-time-clicker",
    initialObjects: {
        "object-ids": SharedMap,
    },
    dynamicObjectTypes: [KeyValueDataObject],
}

export function MultiTimeClicker() {
    const [data, setPair] = useSharedMap("object-ids");
    const container = React.useContext(FluidContext);
    
    const createNewTimeClicker = async () => {
        const id = Date.now().toString();
        // TODO: This is broken
        const newKvp = await container.create(KeyValueDataObject);

        // We set the id as a key so we can get them later
        setPair(id, newKvp.handle);
    }

    const items = [];

    for (let key in data) {
        items.push(<TimeClickerItemAsync handle={data[key]} /> )
    }

    return (
        <div className="App">
            <button onClick={() => {createNewTimeClicker()}}>New Item</button>
            <div>{items}</div>
        </div>
    );
}

export function useFluidHandle<T = IFluidLoadable>(handle: IFluidHandle<T>): T | undefined {
    const [obj, setObj] = React.useState<T | undefined>();
    React.useEffect(() => {
        const load = async () => {
            const obj = await handle.get();
            setObj(obj);
        }

        load();
    }, [handle]);
    return obj;
}

/**
 * Loads a KeyValueDataObject with a given schema.
 * Note: There is no way to remove items from the KVPair.
 * 
 * @returns - [strongly typed object, function to set a key/value, loading boolean]
 */
 export function useSharedMapViaHandle<T = any>(handle: IFluidHandle<SharedMap>): [Record<string, T>, (key: string, value: T) => void, boolean] {
    const [data, setData] = React.useState<Record<string, T>>({});
    const map = useFluidHandle(handle);

    React.useEffect(() => {
        if (map) {
            const updateData = () => setData(Object.fromEntries(map.entries()));
            updateData();
            map.on("valueChanged", updateData);
            return () => {map.off("valueChanged", updateData)};
        }
    }, [map]);

    const setPair = map
        ? (k:string, v:any) => map.set(k,v)
        : () => { throw new Error(`Attempting to write to SharedMap that is not yet loaded. Ensure you are waiting on the loading boolean.`)};
    return [data, setPair, map === undefined];
}

/**
 * Given an id for a DataObject that exists it will generate a TimeClicker
 */
 function TimeClickerItemAsync(props: {handle: IFluidHandle<SharedMap> }) {
    const [data, setPair, loading] = useSharedMapViaHandle(props.handle);

    if (loading) return <div>Loading... </div>;

    return (
    <div className="App">
        SharedMapViaHandle-
        <button onClick={() => setPair("time", Date.now())}>
        { data.time ?? "Click Me 😎" }
            </button>
    </div>);
}