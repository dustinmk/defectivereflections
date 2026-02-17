
export const formatInputDate = (d: Date | null | string) => {
    if (d === null) {
        return "";
    }

    if (typeof d === "string") {
        d = new Date(d);
    }
    
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export const formatDateTime = (d: Date | null | string) => {
    if (d === null) {
        return "";
    }

    if (typeof d === "string") {
        d = new Date(d);
    }
    
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}