import { Category, Section } from "common/model";
import React from "react";

export const Chooser = <T extends {id: number, name: string | React.ReactElement}>({
    item_list,
    value,
    setItem: setCategory
}: {
    item_list: T[],
    value: T | null,
    setItem: (value: T | null) => void
}) => {
    return <div className="chooser">
        <button
            className={!value ? "chooser--active" : ""}
            onClick={() => setCategory(null)}
        >
            All
        </button>
        {[...item_list.values()].map(item => {
            return <button
                className={value && value.id === item.id ? "chooser--active" : ""}
                onClick={() => setCategory(item)}
            >
                {item.name}
            </button>
        })}
    </div>
}
