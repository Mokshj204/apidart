import { Hono } from "hono";

export function createServer(): Hono {
  const app = new Hono();

  app.get("/api/health", (c) => c.json({ ok: true }));

  return app;
}
