import { Category, Section, Status } from "common/model"
import { del, get, put } from "./api"


export const meta_api = {
    fetch_status_list: async () => {
        const result = await get("status")
        return result.status as Status[]
    },
    update_status: async (id: number, name: string, display_name: string) => {
        return await put(`status/${id}`, {name, display_name}) as Status[]
    },
    delete_status: async (id: number) => {
        return await del(`status/${id}`) as Status[]
    },
    fetch_section_list: async () => {
        const result = await get("section")
        return result.status as Section[]
    },
    fetch_category_list: async () => {
        const result = await get("category")
        return result.status as Category[]
    },
    update_category: async (id: number, name: string, parent_id: number | null) => {
        return await put(`category/${id}`, {name, parent_id}) as Category[]
    },
    delete_category: async (id: number) => {
        return await del(`category/${id}`) as Category[]
    },
}