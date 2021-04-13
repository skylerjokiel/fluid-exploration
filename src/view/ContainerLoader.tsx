import React from "react";
import Fluid, { FluidContainer } from "@fluid-experimental/fluid-static";

import { MouseTracker } from "./MouseTracker";
import { ContainerType } from "../utils/types";
import { TimeClicker } from "./TimeClicker";
import { FluidContext } from "../utils/FluidContext";
import { NoteBoard } from "./NoteBoard";
import { DiceRoller } from "./DiceRoller";
import { DiceRollerRemote } from "./DiceRollerRemote";
import { MultiTimeClicker } from "./MultiTimeClicker";
import { ContainerMapping } from "../utils/ContainerMapping";
import { CollectionExample } from "./CollectionExample";

function useFluidContainer(props: ContainerLoaderProps): [FluidContainer | undefined, boolean] {
    const [loadingFailed, setLoadingFailed] = React.useState(false);
    const [container, setContainer] = React.useState<FluidContainer>();

    React.useEffect(() => {
        const load = async () => {
            try {
                // Use the mapping to 
                const containerConfig = ContainerMapping[props.type];
                if (containerConfig === undefined) {
                    throw new Error(`Container type ${[props.type]} is not defined in the ContainerMapping`);
                }
                const fluidContainer = await Fluid.getContainer(props.id, containerConfig);
                setContainer(fluidContainer);
            } catch(e) {
                console.log(e);
                setLoadingFailed(true);
            }
        }

        load();
    }, [props]);

    return [container, loadingFailed]
}

interface ContainerLoaderProps {
    id: string;
    type: ContainerType;
}

export function ContainerLoader(props: ContainerLoaderProps) {
    const [container, loadingFailed] = useFluidContainer(props);

    return container ? 
    <FluidContext.Provider value={container}>
        {
            props.type === "mouse" ? 
            <MouseTracker />
            : props.type === "time" ?
            <TimeClicker />
            : props.type === "noteboard" ?
            <NoteBoard />
            : props.type === "dice-roller" ?
            <DiceRoller />
            : props.type === "dice-roller-remote" ?
            <DiceRollerRemote />
            : props.type === "multi-time-clicker" ?
            <MultiTimeClicker />
            : props.type === "collection-example" ?
            <CollectionExample />
            : <div>😢 Error: Unknown container type [{props.type}]</div>
        }
    </FluidContext.Provider>
    : loadingFailed
    ? <div>Fluid Failed to Load. Maybe your server isn't running? Check the Console Log.</div>
    : <div>Loading...</div>
}