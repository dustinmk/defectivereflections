import React, { useContext } from "react";
import { createContext } from "react"
import { Document } from "common/model"
import {create} from "zustand";
import {combine} from "zustand/middleware";
import { document_api } from "./api/document_api";



export const useDocuments = create(combine({documents: [] as Document[]}, (set) => ({
    fetch: () => document_api.list_documents().then(result => set({ documents: result }))
})));

