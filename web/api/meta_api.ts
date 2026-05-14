import { Category, Section, Status } from "common/model"
import { del, get, post, put } from "./api"


export const meta_api = {
    fetch_status_list: async () => {
        return (await get("status")).status as Status[];
    },
    add_status: async (name: string, display_name: string) => {
        return (await post(`status`, {name, display_name})).status as Status[];
    },
    update_status: async (id: number, name: string, display_name: string) => {
        return (await put(`status/${id}`, {name, display_name})).status as Status[]
    },
    delete_status: async (id: number) => {
        return (await del(`status/${id}`)).status as Status[]
    },
    fetch_section_list: async () => {
        return (await await get("section")).section as Section[];
    },
    fetch_category_list: async () => {
        return (await get("category")).category as Category[]
    },
    add_category: async (name: string, parent_id: number | null) => {
        return (await post(`category`, {name, parent_id})).category as Category[]
    },
    update_category: async (id: number, name: string, parent_id: number | null) => {
        return (await put(`category/${id}`, {name, parent_id})).category as Category[]
    },
    delete_category: async (id: number) => {
        return (await del(`category/${id}`)).category as Category[]
    },
}