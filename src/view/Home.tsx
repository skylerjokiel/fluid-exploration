import Fluid from "../fluidStatic";

import { CollectionExampleContainerDefinition } from "./CollectionExample";
import { DiceRollerContainerDefinition } from "./DiceRoller";
import { DiceRollerRemoteContainerDefinition } from "./DiceRollerRemote";
import { MultiTimeClickerContainerDefinition } from "./MultiTimeClicker";
import { MouseContainerDefinition } from "./MouseTracker";
import { NoteBoardContainerDefinition } from "./NoteBoard";
import { TextAreaContainerDefinition } from "./TextArea";
import { TimeClickerContainerDefinition } from "./TimeClicker";
import { ContainerMapping, ContainerType } from "../utils/ContainerMapping";
import { ContainerConfig } from "../fluidStatic";
import { SimpleCounterContainerDefinition } from "./SimpleCounter";

/**
 * Simple page that has buttons to load different experiences powered by Fluid
 */
export function Home() {
    // createContainer navigates after the async function completes
    const createContainer = async (config: ContainerConfig<ContainerType>) => {
        const id = `${config.name}_${Date.now()}`;
        const configInMap = ContainerMapping[config.name];
        if (configInMap === undefined) {
            throw new Error(`Missing entry for [${config.name}] in the ContaimerMapping.`);
        }
        if (config.name !== configInMap.name) {
            // Runtime check to make sure the Container Map isn't mislabeled.
            throw new Error(`ContaimerMapping has mislabeled config. [${config.name}] points to [${configInMap.name}]`);
        }
        await Fluid.createContainer(id, config)

        console.log(`Created Container of type [${config.name}]. Navigating to new page`);

        // After the container is loaded set the hash which will navigate to the new instance
        window.location.hash = id;
    }
    return (
    <div>
        <button onClick={() => {createContainer(MouseContainerDefinition)}}>New Mouse Tracker</button>
        <button onClick={() => {createContainer(TimeClickerContainerDefinition)}}>New Time Clicker</button>
        <button onClick={() => {createContainer(NoteBoardContainerDefinition)}}>New Note Board</button>
        <button onClick={() => {createContainer(DiceRollerContainerDefinition)}}>New DiceRoller</button>
        <button onClick={() => {createContainer(DiceRollerRemoteContainerDefinition)}}>New DiceRoller Remote</button>
        <button onClick={() => {createContainer(MultiTimeClickerContainerDefinition)}}>New Multi Time Clicker</button>
        <button onClick={() => {createContainer(CollectionExampleContainerDefinition)}}>New Collection Example</button>
        <button onClick={() => {createContainer(TextAreaContainerDefinition)}}>New TextArea</button>
        <button onClick={() => {createContainer(SimpleCounterContainerDefinition)}}>New Simple Counter</button>
    </div>)
}