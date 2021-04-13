import { CollectionExampleContainerDefinition } from "../view/CollectionExample";
import { DiceRollerContainerDefinition } from "../view/DiceRoller";
import { DiceRollerRemoteContainerDefinition } from "../view/DiceRollerRemote";
import { MouseContainerDefinition } from "../view/MouseTracker";
import { MultiTimeClickerContainerDefinition } from "../view/MultiTimeClicker";
import { NoteBoardContainerDefinition } from "../view/NoteBoard";
import { TimeClickerContainerDefinition } from "../view/TimeClicker";

export const ContainerMapping = {
    [DiceRollerContainerDefinition.name]: DiceRollerContainerDefinition,
    [DiceRollerRemoteContainerDefinition.name]: DiceRollerRemoteContainerDefinition,
    [MouseContainerDefinition.name]: MouseContainerDefinition,
    [MultiTimeClickerContainerDefinition.name]: MultiTimeClickerContainerDefinition,
    [NoteBoardContainerDefinition.name]: NoteBoardContainerDefinition,
    [TimeClickerContainerDefinition.name]: TimeClickerContainerDefinition,
    [CollectionExampleContainerDefinition.name]: CollectionExampleContainerDefinition,
}