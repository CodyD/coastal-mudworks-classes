import { Hono } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";

type ButtonConfig = {
  text: string;
  availableDatetime: string;
  url: string;
};

const CONFIG_KEY = "button";

const app = new Hono<{ Bindings: Env }>();

function extractToken(request: Request): string | undefined {
  const header = request.headers.get("Cf-Access-Jwt-Assertion");
  if (header) return header;
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

// Public: get the button config
app.get("/api/config", async (c) => {
  const value = await c.env.BUTTON_CONFIG.get(CONFIG_KEY);
  if (!value) return c.json({ text: "", availableDatetime: "", url: "" });
  return c.json(JSON.parse(value) as ButtonConfig);
});

// Protected: update the button config
app.put("/api/config", async (c) => {
  if (!(await isAuthenticated(c.req.raw, c.env))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const body = await c.req.json<ButtonConfig>();
  await c.env.BUTTON_CONFIG.put(CONFIG_KEY, JSON.stringify(body));
  return c.json({ ok: true });
});

export default app;
