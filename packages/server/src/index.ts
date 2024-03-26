import { Hono, MiddlewareHandler } from "hono";
import { verifyRequestOrigin } from "lucia";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { db, lucia } from "./lib/auth.js";
import type { Session, User } from "lucia";
import { Argon2id } from "oslo/password";
import { randomBytes } from "crypto";
type Variables = {
  session: Session | null;
  user: User | null;
};
const origin = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];
const app = new Hono<{ Variables: Variables }>({});
app.use(
  cors({
    origin,
    allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  }),
);
app.use(csrf());
// string[]
app.use(
  csrf({
    origin,
  }),
);
// alternate to cors
app.use(async (c, next) => {
  console.log(c.req.method, c.req.url);
  if (c.req.method === "GET") {
    await next();
    return;
  }
  // return;
  const originHeader = c.req.header().origin ?? null;
  const hostHeader = c.req.header().host ?? null;

  console.log(originHeader, hostHeader);
  // return;
  console.log(c.req.header().cookie);
  console.log(c.req);
  // return;
  const body = await c.req.json();
  // return;
  console.log(body?.username, body?.password);
  if (
    !originHeader ||
    !hostHeader ||
    !verifyRequestOrigin(originHeader, [hostHeader, "http://localhost:5173"])
  ) {
    c.json({ message: "Forbidden" }, 403);
    console.log("forbidden");
    return;
  }
  await next();
});

const authCookie: MiddlewareHandler<{
  Variables: {
    session: Session | null;
    user: User | null;
  };
}> = async (c, next) => {
  console.log("authCookie");
  const sessionId = lucia.readSessionCookie(c.req.header().cookie ?? "");
  console.log(sessionId);
  if (!sessionId) {
    console.log("no session id");
    c.set("session", null);
    c.set("user", null);
    await next();
    return;
  }

  const { session, user } = await lucia.validateSession(sessionId);
  console.log(session);
  console.log(user);
  if (session && session.fresh) {
    console.log("fresh session");
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
  }

  if (!session) {
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize());
  }

  c.set("session", session);
  c.set("user", user);
  await next();
};

// app.use(authCookie);

app.get("/", async (c) => {
  console.log("root");
  return c.json({
    message: `Hey, did you know that 2 + 2 = ${4}. I know right?`,
  });
});
app.get("/ping", async (c) => c.json({ message: "pong" }));

app.post("/signup", async (c) => {
  console.log("signup");
  const body = await c.req.json();

  try {
    const { username, password } = body;
    console.log(username, password);
    if (!username || !password) {
      return c.json({ message: "Invalid request" }, 400);
    }
    if (await db.user.findUnique({ where: { username } })) {
      return c.json({ message: "Username already exists" }, 400);
    }
    const hashedPassword = await new Argon2id().hash(password);
    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    console.log(user);
    // for mongodb compatibility, not recommended
    // other change is possible in the creating mongoId
    const sessionId = randomBytes(12).toString("hex");
    const session = await lucia.createSession(
      user.id,
      {},
      {
        sessionId,
      },
    );
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
    return c.json({ message: "success" }, 200);
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: error.message }, 500);
  }
});

app.post("/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    console.log(username, password);
    if (!username || !password) {
      c.json({ message: "Invalid request" }, 400);
      return;
    }
    const user = await db.user.findUnique({
      where: {
        username,
      },
    });
    if (!user) {
      return c.json({ message: "Invalid username or password" }, 401);
    }
    const isValidPassword = await new Argon2id().verify(
      user.password,
      password,
    );
    if (isValidPassword) {
      const session = await lucia.createSession(user.id, {});
      c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
      return c.json({ message: "success" }, 200);
      // TODO: send CSRF token
      // c.json({ csrfToken: session.csrfToken });
    } else {
      return c.json({ message: "Invalid username or password" }, 401);
    }
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal server error" }, 500);
  }
});

app.post("/logout", authCookie, async (c) => {
  console.log("logout");
  try {
    if (!c.var.session) {
      return c.json({ message: "Unauthenticated" }, 401);
    }
    await lucia.invalidateSession(c.var.session.id);
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    console.log(c);
    return c.json({ message: "Logged out" }, 200);
  } catch (error: any) {
    // console.log(error.message);
    return c.json({ message: "Internal server error" }, 500);
  }
});

app.get("/profile", authCookie, async (c) => {
  try {
    if (!c.var.session) {
      return c.json({ message: "Unauthenticated" }, 401);
    }
    return c.json(c.var.user);
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default {
  ...app,
  port: 3000,
  fetch: app.fetch,
};

declare global {
  namespace Hono {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
  }
}
