import React, { useEffect } from "react";
import { FluidContext } from "../utils/FluidContext";
import { useFluidObject } from "../utils/useDataObject";

import { ContainerConfig } from "../fluidStatic";
import { ContainerType } from "../utils/ContainerMapping";
import { SharedMap } from "@fluidframework/map";
import { IFluidHandle, IFluidLoadable } from "@fluidframework/core-interfaces";

export const MultiTimeClickerWithHandlesContainerDefinition: ContainerConfig<ContainerType> = {
    name: "multi-time-clicker-with-handles",
    initialObjects: {
        "root-map": SharedMap,
    },
    dynamicObjectTypes: [SharedMap],
}

export function MultiTimeClickerWithHandles() {
    const [, setRefresh] = React.useState({});
    const rootMap = useFluidObject<SharedMap>("root-map")
    const container = React.useContext(FluidContext);

    useEffect(() => {
        if(rootMap) {
            const refreshState = () => {
                setRefresh({});
            };
            rootMap.on("valueChanged", refreshState);
            return () => { rootMap.off("valueChanged", refreshState); };
        }
    }, [rootMap]);

    if (!rootMap) return <div>Loading... </div>;
    
    const createNewTimeClicker = async () => {
        const map = await container.createDetached<SharedMap>(SharedMap);
        // We set the id as a key so we can get them later
        // There's better ways to do this
        rootMap.set(Date.now().toString(), map.handle);
    }

    const items = [];
    for (let key of Array.from(rootMap.keys())) {
        const handle = rootMap.get<IFluidHandle<SharedMap>>(key);
        if (!handle) throw new Error("this should never happen");
        items.push(<TimeClickerItemSharedMapFromHandle handle={handle} />);
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
 function TimeClickerItemSharedMapFromHandle(props: {handle: IFluidHandle<SharedMap> }) {
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