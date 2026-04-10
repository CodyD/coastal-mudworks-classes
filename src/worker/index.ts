import { Hono } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";

type ButtonConfig = {
  text: string;
  availableDatetime: string;
  url: string;
};

const app = new Hono<{ Bindings: Env }>();

function extractToken(request: Request): string | undefined {
  // CF Access injects this header on requests that pass through an Access policy
  const header = request.headers.get("Cf-Access-Jwt-Assertion");
  if (header) return header;
  // For same-domain API calls the CF_Authorization cookie is sent automatically
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function isAuthenticated(request: Request, env: Env): Promise<boolean> {
  const token = extractToken(request);
  if (!token) return false;
  try {
    const JWKS = createRemoteJWKSet(
      new URL(
        `https://${env.CF_ACCESS_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`
      )
    );
    await jwtVerify(token, JWKS, { audience: env.CF_ACCESS_AUD });
    return true;
  } catch {
    return false;
  }
}

// Public: fetch a single button's config
app.get("/api/config/:id", async (c) => {
  const value = await c.env.BUTTON_CONFIG.get(c.req.param("id"));
  if (!value) return c.json({ error: "not found" }, 404);
  return c.json(JSON.parse(value) as ButtonConfig);
});

// Protected: list all button configs (for the admin panel)
app.get("/api/configs", async (c) => {
  if (!(await isAuthenticated(c.req.raw, c.env))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const list = await c.env.BUTTON_CONFIG.list();
  const configs: Record<string, ButtonConfig> = {};
  for (const key of list.keys) {
    const value = await c.env.BUTTON_CONFIG.get(key.name);
    if (value) configs[key.name] = JSON.parse(value) as ButtonConfig;
  }
  return c.json(configs);
});

// Protected: create or update a button config
app.put("/api/config/:id", async (c) => {
  if (!(await isAuthenticated(c.req.raw, c.env))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const body = await c.req.json<ButtonConfig>();
  await c.env.BUTTON_CONFIG.put(c.req.param("id"), JSON.stringify(body));
  return c.json({ ok: true });
});

// Protected: delete a button config
app.delete("/api/config/:id", async (c) => {
  if (!(await isAuthenticated(c.req.raw, c.env))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await c.env.BUTTON_CONFIG.delete(c.req.param("id"));
  return c.json({ ok: true });
});

export default app;
