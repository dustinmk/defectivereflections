import {create} from "zustand";
import {combine} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";
import { post } from "./api";

export const useAuth = create(immer(combine({
    roles: [] as string[],
    username: null as null | string
}, (set, get) => ({
    isSignedIn: async () => {
        const result = await post("me", {}) as {username: string, roles: string[]};
        if (result.roles !== undefined) {
            set({roles: result.roles, username: result.username});
            return true;
        }
        return false;
    },
    login: async (username: string, password: string) => {
        const result = await post("login", {username, password}) as {username: string, roles: string[]};
        if (result.roles !== undefined) {
            set({roles: result.roles, username: result.username})
        }
    },
    logout: async () => {
        const result = await post("logout", {});
        set({roles: [], username: result.username})
    }
}))))