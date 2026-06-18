import React from "react"
import { useNavigate } from "react-router";
import { useAuth } from "web/api/auth_api";

export default function() {
    const auth = useAuth();
    const navigate = useNavigate();
    
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");

    return <div>
        <input type="text" value={username} onChange={evt => setUsername(evt.target.value)}></input>
        <input type="password" value={password} onChange={evt => setPassword(evt.target.value)}></input>
        <button onClick={() => auth.login(username, password).then(() => navigate("/admin"))}>Login</button>
    </div>
}
