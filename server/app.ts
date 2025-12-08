import path from "path";
import express from "express";
import session from "express-session";
import RedisStore from "connect-redis";
import * as redis from "redis";
import config from "server/config";

declare module "express-session" {
    interface SessionData {
        username: number;
        roles: string[];
    }
  }

  
const app = express();

app.use(express.static(path.resolve(process.cwd(), "../web")));
app.use(express.json());
app.set("trust proxy", 1);

// https://www.npmjs.com/package/connect-redis

const redis_client = redis.createClient({
    url: `redis://${config.redis.host}:${config.redis.port}`
});

redis_client.connect().catch(console.error);
const redis_store = new RedisStore({
    client: redis_client,
    prefix: "web:"
});

// TODO: secret generated in db, pass array of secrets to session
app.use(session({
    store: redis_store,
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 1000 * 60 * 10
    }
}));

export default app;