import React, { useState } from "react";
import { SharedMapCollection } from "../dataObjects/SharedMapCollection";
import { ContainerDefinition } from "../utils/types";
import { useDataObject } from "../utils/useDataObject";


export const CollectionExampleContainerDefinition: ContainerDefinition = {
    name: "collection-example",
    initialObjects: {
        "shared-map-collection-1": SharedMapCollection
    },
}

/**
 * Loads a DataObject of a given type
 */
 export function useSharedMapCollection(id: string): SharedMapCollection | undefined {
    const collection = useDataObject<SharedMapCollection>(id);
    const [, newUpdate] = useState<object>();

    React.useEffect(() => {
        if (!collection) return;
        // Super jenky way to do this
        const update = () => {
            newUpdate({});
        }
        collection.on("newMap", update);

        return () => { collection.on("newMap", update); };

    }, [collection])

    return collection;
}

export function CollectionExample() {
    const collection = useSharedMapCollection("shared-map-collection-1");
    if (!collection) return <div>Loading... </div>;

    const viewObj = [];
    viewObj.push(<div key="foo">{collection.ids.length}</div>)
    viewObj.push(<div key="foo1">{Array.from(collection.theRoot.keys()).length}</div>)
    for (const id of collection.ids) {
        const map = collection.get(id);
        const date = map?.get("foo") ?? "unknown";
        viewObj.push(<div key={date}>{date}</div>)
    }

    const createNewMap = () => {
        const newMap = collection.create(Date.now().toString());
        newMap.set("foo", Date.now().toString());
    }

    return (
    <div className="App">
        <button onClick={createNewMap}>
            {"Click Me 😎" }
        </button>
        {viewObj}
    </div>);
}