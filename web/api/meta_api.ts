import { Category, Section, Status } from "common/model"
import { del, get, post, put } from "./api"


export const meta_api = {
    fetch_status_list: async (section_id: number | null, category_id: number | null) => {
        return (await get("status", {section_id: section_id || "", category_id: category_id || ""})).status as Status[];
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
    fetch_section_list: async (status_id: number | null, category_id: number | null) => {
        return (await await get("section", {status_id: status_id || "", category_id: category_id || ""})).section as Section[];
    },
    fetch_category_list: async (status_id: number | null, section_id: number | null) => {
        return (await get("category", {status_id: status_id || "", section_id: section_id || ""})).category as Category[]
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