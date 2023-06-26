import { validate } from "jsonschema"
import app from "server/app";
import { createAdminUser, getUserCount } from "server/repository/users";

app.get("/api/init", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.post("/api/init", async (req, res) => {
    const validation_result = validate(req.body, {
        id: "/init",
        type: "object",
        properties: {
            name: {type: "string", minLength: 3, maxLength: 255},
            username: {type: "string", minLength: 3, maxLength: 255, pattern: `^[A-Za-z0-9_.-]*$`},
            email: {type: "string", format: "email"},
            password: {type: "string", minLength: 8, maxLength: 255}
        },
        required: ["name", "username", "email", "password"]
    });
    
    if (!validation_result.valid) {
        return res.status(400).json({error: "Invalid parameters"});
    }

    if (await getUserCount() > 0) {
        return res.status(403).json({error: "Unauthorized"});
    }

    const admin_id = await createAdminUser(req.body);
    return res.json({id: admin_id});
});