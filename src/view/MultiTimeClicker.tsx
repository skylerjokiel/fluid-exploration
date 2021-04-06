import React from "react";
import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { FluidContext } from "../utils/FluidContext";
import { useKeyValuePair } from "../utils/useDataObject";

import { TimeClickerItemKV } from "./TimeClicker";
import { ContainerConfig } from "../fluidStatic";
import { ContainerType } from "../utils/ContainerMapping";

export const MultiTimeClickerContainerDefinition: ContainerConfig<ContainerType> = {
    name: "multi-time-clicker",
    dataTypes: [KeyValueDataObject],
    initialObjects: {
        "object-ids": KeyValueDataObject,
    },
}

export function MultiTimeClicker() {
    const [data, setPair, loading] = useKeyValuePair("object-ids");
    const container = React.useContext(FluidContext);

    if (loading) return <div>Loading... </div>;
    
    const createNewTimeClicker = async () => {
        const [, id] = await container.create(KeyValueDataObject);

        // We set the id as a key so we can get them later
        setPair(id, "");
    }

    const items = [];

    for (let key in data) {
        items.push(<TimeClickerItemKV id={key} />);
    }

    return (
        <div className="App">
            <button onClick={() => {createNewTimeClicker()}}>New Item</button>
            <div>{items}</div>
        </div>
    );
}

