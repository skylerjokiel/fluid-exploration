import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { SharedMap } from "@fluidframework/map";
import { ContainerConfig } from "../fluidStatic";
import { ContainerType } from "../utils/ContainerMapping";
import { useKeyValuePair, useSharedMap } from "../utils/useDataObject";

export const TimeClickerContainerDefinition: ContainerConfig<ContainerType> = {
    name: "time",
    initialObjects: {
        "time-clicker-data": KeyValueDataObject,
        "time-clicker-map": SharedMap
    },
}

/**
 * Single Hard Coded Time Clicker
 */
export function TimeClicker() {
    return (
        <>
            <TimeClickerItemKV id={"time-clicker-data"} />
            <TimeClickerItemSharedMap id={"time-clicker-map"} />
        </>
    );
}

/**
 * Given an id for a DataObject that exists it will generate a TimeClicker
 */
export function TimeClickerItemKV(props: {id: string}) {
    const [data, setPair, loading] = useKeyValuePair<number>(props.id);
    
    if (loading) return <div>Loading... </div>;

    return (
    <div className="App">
        KVPair-
        <button onClick={() => setPair("time", Date.now())}>
            { data.time ?? "Click Me 😎" }
        </button>
    </div>);
}
/**
 * Given an id for a DataObject that exists it will generate a TimeClicker
 */
 export function TimeClickerItemSharedMap(props: {id: string}) {
    const [data, setPair, loading] = useSharedMap<number>(props.id);
    
    if (loading) return <div>Loading... </div>;

    return (
    <div className="App">
        SharedMap-
        <button onClick={() => setPair("time", Date.now())}>
        { data.time ?? "Click Me 😎" }
            </button>
    </div>);
}