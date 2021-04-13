import React from "react";
import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { ContainerDefinition } from "../utils/types";
import { useKeyValueDataObject } from "../utils/useDataObject";
import { MouseTracker, MouseContainerDefinition } from "./MouseTracker";

export const NoteBoardContainerDefinition: ContainerDefinition = {
    name: "noteboard",
    initialObjects: {
        "note-location-data": KeyValueDataObject,
        "note-content-data": KeyValueDataObject,
        ...MouseContainerDefinition.initialObjects,
    },
}

export interface NoteInfo {
    x: number;
    y: number;
    text: string;
}

export function NoteBoard() {
    const [locationData, setLocationDataItem] = useKeyValueDataObject<{ x: number, y: number }>("note-location-data");
    const [contentData, setContentDataItem] = useKeyValueDataObject<string>("note-content-data");
    const [mouseTracking, setMouseTracking] = React.useState(false);

    const notes = [];
    for (let key in locationData) {
        const item = { ...locationData[key], text: contentData[key] };

        const setPosition = (x: number, y: number) => {
            setLocationDataItem(key, { x, y });
        }

        const setText = (text: string) => {
            setContentDataItem(key, text);
        }
        notes.push(<Note info={item} id={key} setPosition={setPosition} setText={setText} />)
    }

    const newNote = () => {
        const id = (Date.now() * Math.random()).toString();
        // We want to store the content first. If we have content without a location that's okay
        // If we have a location with out content we will render without content.
        setContentDataItem(id, "Important Info");
        setLocationDataItem(id, { x: 10 + (notes.length * 10), y: 40 })
    }

    return (
        <div style={{position: "relative"}}>
            <button onClick={newNote} style={{ zIndex: 1 }} >Create Note</button>
            <button onClick={() => { setMouseTracking(!mouseTracking) }} style={{ zIndex: 1 }} >
                Mouse Tracking [{mouseTracking ? "Enabled" : "Disabled"}]
            </button>
            {notes}
            {mouseTracking && <MouseTracker />}
        </div>);
}

interface NoteProps {
    info: NoteInfo,
    id: string,
    setPosition: (x: number, y: number) => void
    setText: (text: string) => void
}

function Note(props: NoteProps) {
    const bodyStyle: React.CSSProperties = {
        position: "relative",
        margin: "2px",
        padding: "none",
        border: "none",
        borderRadius: "none",
        outline: "none",
        resize: "none",
    };
    const headerStyle: React.CSSProperties = {
        position: "relative",
        borderBottom: "1px solid black",
        backgroundColor: "gray",
        height: "15%",
    };
    const wrapperStyle: React.CSSProperties = {
        zIndex: 0,
        position: "absolute",
        top: props.info.y,
        left: props.info.x,
        width: "200px",
        height: "200px",
        border: "1px solid black",
        backgroundColor:"white"
    };

    const handleMouseDown = (initialEvent: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const mouseActiveHandler = (event: MouseEvent) => {
            const shiftX = initialEvent.pageX - props.info.x;
            const shiftY = initialEvent.pageY - props.info.y;
            props.setPosition(event.pageX - shiftX, event.pageY - shiftY);
        };
        document.addEventListener("mousemove", mouseActiveHandler);
        const removeListenerHandler = () => {
            document.removeEventListener("mousemove", mouseActiveHandler);
            // Removes itself to prevent memory leaks
            document.removeEventListener("mouseup", removeListenerHandler);
        }
        document.addEventListener("mouseup", removeListenerHandler);
    }

    return (
        <div key={props.id} style={wrapperStyle}>
            <div style={headerStyle} onMouseDown={handleMouseDown}></div>
            <textarea
                rows={10}
                cols={24}
                maxLength={240}
                style={bodyStyle}
                onChange= {(a) => {props.setText(a.currentTarget.value ?? "a")}}
                value={props.info.text} />
        </div>);
}
