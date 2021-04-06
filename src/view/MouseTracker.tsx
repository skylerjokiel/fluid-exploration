import React from "react";
import { KeyValueDataObject } from "@fluid-experimental/data-objects";
import { useKeyValuePair } from "../utils/useDataObject";
import { ContainerConfig } from "../fluidStatic";
import { ContainerType } from "../utils/ContainerMapping";

export const MouseContainerDefinition: ContainerConfig<ContainerType> = {
    name: "mouse",
    initialObjects: {
        "mouse-track-info": KeyValueDataObject,
    },
}

interface CursorInfo {
    x: number;
    y: number;
    color: string;
    active: boolean;
}

const userId = Math.floor(Date.now()*Math.random()).toString();

export function useMouseTracker(): Record<string, CursorInfo> {
    const [data, setData, loading] = useKeyValuePair<CursorInfo>("mouse-track-info");

    React.useEffect(() => {
        if (!loading) {
            let lastUpdateTime = 0;
            const updateMouse = (event: MouseEvent) => {

                // We want to avoid spamming the server and the cursor can move faster than the screen can paint.
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime < 5) {
                    lastUpdateTime = currentTime;
                    return;
                }

                lastUpdateTime = currentTime;
                let cursorInfo: CursorInfo = data[userId] ?? { x:event.pageX, y:event.pageY, color: getRandomColor(), active: true};
                cursorInfo.x = event.pageX;
                cursorInfo.y = event.pageY;
                cursorInfo.active = true;
                setData(userId, cursorInfo);
            }

            document.addEventListener("mousemove", updateMouse);

            const handleMouseEnter = () => {
                document.addEventListener("mousemove", updateMouse);
            }
            document.addEventListener("mouseenter", handleMouseEnter);

            const handleMouseLeave= () => {
                document.removeEventListener("mousemove", updateMouse);

                const cursorInfo: CursorInfo = data[userId];
                if (cursorInfo === undefined) return;

                cursorInfo.active = false;
                setData(userId, cursorInfo);
            }
            document.addEventListener("mouseleave", handleMouseLeave);
            return () => { 
                // TODO: We need to ensure the developer has a way to close the container
                // It's currently running in the background
                document.removeEventListener("mousemove", updateMouse);
                document.removeEventListener("mouseenter", handleMouseEnter);
                document.removeEventListener("mouseleave", handleMouseLeave);
            }
        }
    }, [data, setData, loading]);

    return data;
}

export function MouseTracker() {
    const data = useMouseTracker();

    const cursors = [];
    for (let key in data) {
        const item = data[key];
        if (item.active) {
            cursors.push(<CursorIcon info={item} id={key} />)
        }
    }

    return (<>{cursors}</>);
}

interface CursorIconProps {
    info: CursorInfo,
    id: string,
}

function CursorIcon(props: CursorIconProps) {
    const style: React.CSSProperties = {
        zIndex: 1000,
        position: "fixed",
        top: props.info.y - 10,
        left: props.info.x - 10,
        width: "20px",
        height: "20px",
        backgroundColor: props.info.color,
        borderRadius: "10px",
        boxShadow: `0 0 5 .5 ${props.info.color}`,
        pointerEvents: "none",
    };
    return (<div key={props.id} style={style}></div>);
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
