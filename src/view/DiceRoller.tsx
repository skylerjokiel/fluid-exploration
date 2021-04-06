import React from "react";
import { DiceRollerDataObject, IDiceRoller } from "../dataObjects/DiceRoller";
import { ContainerConfig } from "../fluidStatic";
import { ContainerType } from "../utils/ContainerMapping";
import { useFluidObject } from "../utils/useDataObject";

export const DiceRollerContainerDefinition: ContainerConfig<ContainerType> = {
    name: "dice-roller",
    initialObjects: {
        "dice-roller-key": DiceRollerDataObject,
    },
}

/**
 * This is very future thinking. It demonstrates how DataObjects can contain a view.
 */
export function DiceRoller() {
    const dataObject = useFluidObject<DiceRollerDataObject>("dice-roller-key");
    return dataObject
        ? <DiceRollerView model={dataObject} />
        : <div>Loading DiceRoller... </div>;
}

interface IDiceRollerViewProps {
    model: IDiceRoller;
}

const DiceRollerView: React.FC<IDiceRollerViewProps> = (props: IDiceRollerViewProps) => {
    const [diceValue, setDiceValue] = React.useState(props.model.value);

    React.useEffect(() => {
        const onDiceRolled = () => {
            setDiceValue(props.model.value);
        };
        props.model.on("diceRolled", onDiceRolled);
        return () => {
            props.model.off("diceRolled", onDiceRolled);
        };
    }, [props.model]);

    // Unicode 0x2680-0x2685 are the sides of a dice (⚀⚁⚂⚃⚄⚅)
    const diceChar = String.fromCodePoint(0x267F + diceValue);

    return (
        <div>
            <span style={{ fontSize: 50 }}>{diceChar}</span>
            <button onClick={props.model.roll}>Roll</button>
        </div>
    );
};