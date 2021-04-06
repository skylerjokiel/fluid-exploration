import React from "react";
import { FluidContext } from "../utils/FluidContext";
import { useSharedMap } from "../utils/useDataObject";

import { TimeClickerItemSharedMap } from "./TimeClicker";
import { ContainerConfig } from "../fluidStatic";
import { ContainerType } from "../utils/ContainerMapping";
import { SharedMap } from "@fluidframework/map";

export const MultiTimeClickerWithHandlesContainerDefinition: ContainerConfig<ContainerType> = {
    name: "multi-time-clicker-with-handles",
    initialObjects: {
        "object-ids": SharedMap,
    },
    dynamicObjectTypes: [SharedMap],
}

export function MultiTimeClickerWithHandles() {
    const [data, setPair, loading] = useSharedMap("object-ids");
    const container = React.useContext(FluidContext);

    if (loading) return <div>Loading... </div>;
    
    const createNewTimeClicker = async () => {
        const [, id] = await container.create<SharedMap>(SharedMap);

        // We set the id as a key so we can get them later
        // There's better ways to do this
        setPair(id, "");
    }

    const items = [];

    for (let key in data) {
        items.push(<TimeClickerItemSharedMap id={key} />);
    }

    return (
        <div className="App">
            <button onClick={() => {createNewTimeClicker()}}>New Item</button>
            <div>{items}</div>
        </div>
    );
}

