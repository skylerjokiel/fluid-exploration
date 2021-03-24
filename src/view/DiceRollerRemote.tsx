import React from "react";
import { DiceRollerRemoteDataObject, IDiceRollerRemoteDataObject } from "../dataObjects/DiceRollerRemote";
import { ContainerCreateConfig } from "../fluidStatic";
import { ContainerType } from "../utils/ContainerMapping";
import { useFluidObject } from "../utils/useDataObject";

export const DiceRollerRemoteContainerDefinition: ContainerCreateConfig<ContainerType> = {
    name: "dice-roller-remote",
    dataTypes: [DiceRollerRemoteDataObject],
    initialObjects: {
        "dice-roller-remote-key": DiceRollerRemoteDataObject,
    },
}

/**
 * This is very future thinking. It demonstrates how DataObjects can contain a view.
 */
export function DiceRollerRemote() {
    const dataObject = useFluidObject<DiceRollerRemoteDataObject>("dice-roller-remote-key");

    return dataObject
        ? <DiceRollerRemoteView model={dataObject} />
        : <div>Loading DiceRoller... </div>;
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