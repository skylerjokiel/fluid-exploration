import { ContainerConfig } from "@fluid-experimental/fluid-static";

export type ContainerType =
    "mouse"
    | "time"
    | "noteboard"
    | "dice-roller"
    | "dice-roller-remote"
    | "multi-time-clicker"
    | "collection-example";

export interface ContainerDefinition extends ContainerConfig {
    name: ContainerType;
}