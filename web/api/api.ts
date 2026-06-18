import {__PRODUCTION__, config as _config} from "web/config";

export type GetParams = {[index: string]: string | number | boolean | Array<string | number | boolean>};

export const get = (path: string, params: GetParams= {}) => {
    return apiQuery(path, "GET", params, {}) as {[index: string]: any};
}

export const file = (path: string, params: GetParams = {}) => {
    return apiQuery(path, "FILE", params, {}) as Promise<Response>;
}

export const post = (path: string, body: object) => {
    return apiQuery(path, "POST", {}, body) as {[index: string]: any};
}

export const put = (path: string, body: object)  => {
    return apiQuery(path, "PUT", {}, body) as {[index: string]: any};
}

export const patch = (path: string, body: object)  => {
    return apiQuery(path, "PATCH", {}, body) as {[index: string]: any};
}

export const del = (path: string, params: GetParams = {}) => {
    return apiQuery(path, "DELETE", params, {}) as {[index: string]: any};
}

const encodeParams = (prefix: string, params: GetParams): string => {
    if (typeof params === "string") {
        return `${encodeURIComponent(prefix)}=${encodeURIComponent(params)}`;
    }
    
    const keys: string[] = [];
    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            keys.push(key);
        }
    }

    const result = keys.map(key => {
        const value = params[key];
        const key_string = prefix === ""
            ? encodeURIComponent(key)
            : `${encodeURIComponent(prefix)}[${encodeURIComponent(key)}]`;

        if (Array.isArray(value)) {
            return (value as Array<any>).map(elem => {
                return encodeParams(encodeURIComponent(key_string), elem);
            }).join("&");

        } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return `${key_string}=${encodeURIComponent(value)}`

        } else if (typeof value === "object") {
            return encodeParams(encodeURIComponent(key_string), value);
        }

        return "";

    }).join("&");

    if (prefix === "") {
        return "?" + result;
    }

    return result;
}

export class ApiError extends Error {
    public status: string;
    public response_message: string;

    constructor(public response: {status: string, message: string}) {
        super(`API Error ${response.status}: ${response.message}`);
        this.status = response.status;
        this.response_message = response.message;
    }
}

const apiQuery = async (path: string, method: string, params: GetParams, body: object) => {
    const config = _config;
    
    const param_string = encodeParams("", params);
    
    const body_string = JSON.stringify(body);

    const headers: string[][] = [["Content-Type", "application/json"]];

    const header_content = headers.reduce(
        (acc, header) => {acc[header[0]] = header[1]; return acc}, {} as {[index: string]: string});

    const is_file = method === "FILE";
    if (is_file) {
        method = "GET";
    }

    const response_promise = new Promise<object>(resolve => {
        let retries = 5;
        let wait = 0.5;

        const try_request = async () => {
            const response = await fetch(`${config.api_root}/${path}${param_string}`, {
                method,
                mode: __PRODUCTION__ ? undefined : "cors",
                headers: header_content,
                body: method === "GET" || method === "DELETE"
                    ? undefined
                    : body_string
            });

            // Retry only if internal server error, not client errors or redirects
            if ([2, 3, 4].indexOf(Math.floor(response.status / 100)) >= 0) {
                if (is_file) {
                    resolve(await response);
                    return;
                }

                try {
                    const data = await response.json();
                    
                    if (response.status === 401 || response.status === 403) {
                        throw new ApiError({
                            status: "auth",
                            message: data.message
                        });
                    } else {
                        return resolve(data);
                    }
                }
                catch (err) {
                    throw err;
                }
            }

            // Retry if 5xx error or other
            retries -= 1;
            wait *= 1.5;
    
            if (retries > 0) {
                setTimeout(try_request, wait);
                return;
            }

            try {
                const result = await response.json();
                throw new ApiError({status: "error", message: result.message !== undefined ? result.message : "Unknown error"});
            } catch (err) {
                throw new ApiError({status: "error", message: `Unknown error: ${err}`})
            }
        }

        try_request();
    });

    const response = (await response_promise) as {[index: string]: string};
    if (is_file) {
        return response;
    }

    return response as {[index: string]: any}
}

const debounce_map = new Map<any, () => void>();
export const debounce = (f: () => void, key: any, time = 500) => {
    debounce_map.set(key, f);
    setTimeout(() => {
        const handler = debounce_map.get(key);
        debounce_map.delete(key);
        if (handler !== undefined) {
            handler();
        }
    }, 500);
}