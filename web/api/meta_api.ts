import { Status } from "common/model"
import { get } from "./api"


export const meta_api = {
    fetch_status_list: async () => {
        return await get("/api/status").status as Status[]
    }
}