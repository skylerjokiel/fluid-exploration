import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { DataObject } from "@fluidframework/aqueduct";
import React from "react";
import { FluidContext } from "./FluidContext";

/**
 * Loads a DataObject of a given type
 */
export function useDataObject<T extends DataObject>(id: string): T | undefined {
    const [dataObject, setDataObject] = React.useState<T | undefined>();
    const container = React.useContext(FluidContext);

    React.useEffect(() => {
        const load = async () => {
            const keyValueDataObject = await container.initialObjects[id] as T;
            setDataObject(keyValueDataObject);
        }

        load();
    }, [id, container]);

    return dataObject;
}

/**
 * Loads a KeyValueDataObject with a given schema.
 * Note: There is no way to remove items from the KVPair.
 * 
 * @returns - [strongly typed object, function to set a key/value, loading boolean]
 */
export function useKeyValueDataObject<T = any>(id: string): [Record<string, T>, (key: string, value: T) => void, boolean] {
    const [data, setData] = React.useState<Record<string, T>>({});
    const dataObject = useDataObject<KeyValueDataObject>(id);

    React.useEffect(() => {
        if (dataObject) {
            const updateData = () => setData(dataObject.query());
            updateData();
            dataObject.on("changed", updateData);
            return () => {dataObject.off("change", updateData)};
        }
    }, [dataObject]);

    const setPair = dataObject
        ? dataObject.set
        : () => { throw new Error(`Attempting to write to DataObject ${id} that is not yet loaded. Ensure you are waiting on the loading boolean.`)};
    return [data, setPair, dataObject === undefined];
}
