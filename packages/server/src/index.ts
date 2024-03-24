import { Hono } from "hono";

const app = new Hono({});

app.get("/", async (c) => {
  return c.json({
    message: `Hey, did you know that 2 + 2 = ${4}. I know right?`,
  });
});
app.get("/ping", async (c) => c.json({ message: "pong" }));

export default {
  ...app,
  port: 9001,
  fetch: app.fetch,
};
