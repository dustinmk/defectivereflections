
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

export function flattenBitmapData(data: number[][][]) {
    const output: number[] = [];
    for (const row of data) {
        for (const point of row) {
            output.push(point[0]);
            output.push(point[1]);
            output.push(point[2]);
            output.push(1.0);
        }
    }
    return output;
}

export function toInt(v: number | string | null | undefined) {
    if (v === null || v === undefined) {
        return null;
    }

    if (typeof v === "string") {
        const r = parseInt(v);
        if (isNaN(r)) {
            return null;
        }

        return r;
    }

    return v;
}