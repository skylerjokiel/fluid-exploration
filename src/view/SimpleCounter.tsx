import React from "react";
import { SharedCounter } from "@fluidframework/counter";
import { ContainerConfig } from "../fluidStatic";
import { ContainerType } from "../utils/ContainerMapping";
import { useFluidObject } from "../utils/useDataObject";

export const SimpleCounterContainerDefinition: ContainerConfig<ContainerType> = {
    name: "simple-counter",
    initialObjects: {
        "counter-id": SharedCounter
    },
}

const useSharedCounter = (id: string): [number, () => void, boolean] => {
    const [value, setValue] = React.useState(0);
    const counter = useFluidObject<SharedCounter>(id);

    React.useEffect(() => {
        if (counter) {
            setValue(counter.value);
            const handleIncrement = (_: number,newValue: number) => {
                setValue(newValue);
            };
            counter.on("incremented", handleIncrement);

            return () => { counter.off("incremented", handleIncrement); }
        }
    }, [counter, value])

    const increment = counter === undefined
        ? () => { throw new Error("Attempting to increment before Counter is loaded") }
        : () => {counter.increment(1)};

    return [value, increment, counter === undefined]
}

export function SimpleCounter() {
    const [value, increment, loading] = useSharedCounter("counter-id");

    if (loading) return <div>Loading... </div>;

    return (
    <div className="App">
        <button onClick={increment}>{ value }</button>
    </div>);
}
