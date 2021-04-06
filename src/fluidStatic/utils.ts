import { DataObjectClass, SharedObjectClass } from "./types";

export function isDataObjectClass(obj: any): obj is DataObjectClass {
    return obj?.factory !== undefined;
}

export function isSharedObjectClass(obj: any): obj is SharedObjectClass {
    return obj?.getFactory !== undefined;
}