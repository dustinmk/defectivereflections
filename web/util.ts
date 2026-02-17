
export const formatInputDate = (d: Date | null | string) => {
    if (d === null) {
        return "";
    }

    if (typeof d === "string") {
        d = new Date(d);
    }
    
    const year = d.getFullYear();
    const month = d.getMonth().toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hour = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    const sec = d.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hour}:${min}:${sec}`
}

export const formatDateTime = (d: Date | null | string) => {
    if (d === null) {
        return "";
    }

    if (typeof d === "string") {
        d = new Date(d);
    }
    
    const year = d.getFullYear();
    const month = d.getMonth().toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hour = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    const sec = d.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hour}:${min}:${sec}`
}