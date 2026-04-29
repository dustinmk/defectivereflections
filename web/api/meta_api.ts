import { Section, Status } from "common/model"
import { get } from "./api"


export const meta_api = {
    fetch_status_list: async () => {
        const result = await get("status")
        return result.status as Status[]
    },
    fetch_section_list: async () => {
        const result = await get("section")
        return result.status as Section[]
    }
}