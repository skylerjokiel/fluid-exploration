import React from "react";
import { DiceRollerRemoteDataObject, IDiceRollerRemoteDataObject } from "../dataObjects/DiceRollerRemote";
import { FluidContext } from "../utils/FluidContext";
import { ContainerDefinition } from "../utils/types";

export const DiceRollerRemoteContainerDefinition: ContainerDefinition = {
    name: "dice-roller-remote",
    initialObjects: {
        diceRollerRemoteKey: DiceRollerRemoteDataObject,
    },
}

/**
 * This is very future thinking. It demonstrates how DataObjects can contain a view.
 */
export function DiceRollerRemote() {
    const container = React.useContext(FluidContext);
    const dataObject = container.initialObjects.diceRollerRemoteKey as DiceRollerRemoteDataObject;

    return <DiceRollerRemoteView model={dataObject} />;
}

interface IDiceRollerViewProps {
    model: IDiceRollerRemoteDataObject;
}

/**
 * To use this you need to have the server running and have CORS disabled for localhost
 */
const DiceRollerRemoteView: React.FC<IDiceRollerViewProps> = (props: IDiceRollerViewProps) => {
    const [diceValue, setDiceValue] = React.useState(props.model.value);

    React.useEffect(() => {
        const onDiceRolled = () => {
            setDiceValue(props.model.value);
        };
        props.model.on("update", onDiceRolled);
        return () => {
            props.model.off("update", onDiceRolled);
        };
    }, [props.model]);

    // Unicode 0x2680-0x2685 are the sides of a dice (⚀⚁⚂⚃⚄⚅)
    const diceChar = String.fromCodePoint(0x267F + diceValue);

    return (
        <div>
            <span style={{ fontSize: 50 }}>{diceChar}</span>
            <button onClick={props.model.roll}>Roll</button>
            <button onClick={props.model.endSession}>End</button>
        </div>
    );
};