import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { SharedMap } from "@fluidframework/map";
import React from "react";

import { FluidContext } from "./FluidContext";

/**
 * Loads a KeyValueDataObject with a given schema.
 * Note: There is no way to remove items from the KVPair.
 * 
 * @returns - [strongly typed object, function to set a key/value]
 */
export function useKeyValueDataObject<T = any>(id: string): [Record<string, T>, (key: string, value: T) => void] {
    const [data, setData] = React.useState<Record<string, T>>({});
    const container = React.useContext(FluidContext);
    const kvpObj = container.initialObjects[id] as KeyValueDataObject;

    React.useEffect(() => {
        const updateData = () => setData(kvpObj.query());
        updateData();
        kvpObj.on("changed", updateData);
        return () => {kvpObj.off("change", updateData)};
    }, [kvpObj]);

    return [data, kvpObj.set];
}

/**
 * Loads a KeyValueDataObject with a given schema.
 * Note: There is no way to remove items from the KVPair.
 * 
 * @returns - [strongly typed object, function to set a key/value]
 */
 export function useSharedMap<T = any>(id: string): [Record<string, T>, (key: string, value: T) => void] {
    const [data, setData] = React.useState<Record<string, T>>({});
    const container = React.useContext(FluidContext);
    const map = container.initialObjects[id] as SharedMap;

    React.useEffect(() => {
        if (map) {
            const updateData = () => setData(Object.fromEntries(map.entries()));
            updateData();
            map.on("valueChanged", updateData);
            return () => {map.off("valueChanged", updateData)};
        }
    }, [map]);

    const setPair = (k:string, v:any) => map.set(k,v);
    return [data, setPair];
}