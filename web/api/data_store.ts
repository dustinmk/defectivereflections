import { Status } from "common/model"
import React from "react"
import { document_api } from "./document_api";
import { meta_api } from "./meta_api";


export const useStatusStore = () => {
    const [status, setStatus] = React.useState<Status[]>([]);
    React.useEffect(() => {
        meta_api.fetch_status_list()
            .then(result => setStatus(result));
    }, []);
    
    return new Map<number, Status>(status.map(i => [i.id, i]));
}