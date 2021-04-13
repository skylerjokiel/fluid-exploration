import React from "react";
import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { ContainerDefinition } from "../utils/types";
import { FluidContext } from "../utils/FluidContext";
import { useKeyValueDataObject } from "../utils/useDataObject";

import { TimeClickerItem } from "./TimeClicker";

export const MultiTimeClickerContainerDefinition: ContainerDefinition = {
    name: "multi-time-clicker",
    initialObjects: {
        "object-ids": KeyValueDataObject,
    },
    dynamicObjectTypes: [KeyValueDataObject],
}

export function MultiTimeClicker() {
    const [data, setPair, loading] = useKeyValueDataObject("object-ids");
    const container = React.useContext(FluidContext);

    if (loading) return <div>Loading... </div>;
    
    const createNewTimeClicker = async () => {
        const id = Date.now().toString();
        // TODO: This is broken
        await container.create(KeyValueDataObject);

        // We set the id as a key so we can get them later
        setPair(id, "");
    }

    const items = [];

    for (let key in data) {
        items.push(<TimeClickerItem id={key} /> )
    }

    return (
        <div className="App">
            <button onClick={() => {createNewTimeClicker()}}>New Item</button>
            <div>{items}</div>
        </div>
    );
}

