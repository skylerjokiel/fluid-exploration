import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { ContainerDefinition } from "../utils/types";
import { useKeyValueDataObject } from "../utils/useDataObject";

export const TimeClickerContainerDefinition: ContainerDefinition = {
    name: "time",
    initialObjects: {
        "time-clicker-data": KeyValueDataObject
    },
}

/**
 * Single Hard Coded Time Clicker
 */
export function TimeClicker() {
    return (
        <TimeClickerItem id={"time-clicker-data"} />
    );
}

/**
 * Given an id for a DataObject that exists it will generate a TimeClicker
 */
export function TimeClickerItem(props: {id: string}) {
    const [data, setPair] = useKeyValueDataObject<number>(props.id);

    return (
    <div className="App">
        <button onClick={() => setPair("time", Date.now())}>
        { data.time ?? "Click Me 😎" }
            </button>
    </div>);
}