import { useEffect, useState } from "react";
import "./Update.css";

type Config = {
  text: string;
  availableDatetime: string;
  url: string;
};

const empty = (): Config => ({ text: "", availableDatetime: "", url: "" });

function Update() {
  const [form, setForm] = useState<Config>(empty());
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? (r.json() as Promise<Config>) : Promise.reject()))
      .then(setForm)
      .catch(() => {});
  }, []);

  function set(field: keyof Config, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.status === 401) {
      window.location.href = "/cdn-cgi/access/login";
      return;
    }
    setStatus(res.ok ? "Saved." : "Save failed.");
  }

  return (
    <div className="update">
      <div className="header">
        <h1>Button Settings</h1>
        <a href="/cdn-cgi/access/login" className="sign-in">Sign in</a>
      </div>
      <form onSubmit={handleSave}>
        <label>
          Button Text
          <input
            value={form.text}
            onChange={(e) => set("text", e.target.value)}
            placeholder="e.g. Register Now"
            required
          />
        </label>
        <label>
          Available Date / Time <span className="tz">(Eastern Time)</span>
          <input
            type="datetime-local"
            value={form.availableDatetime}
            onChange={(e) => set("availableDatetime", e.target.value)}
            required
          />
        </label>
        <label>
          URL
          <input
            type="url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://..."
            required
          />
        </label>
        <button type="submit">Save</button>
      </form>
      {status && <p className="status">{status}</p>}
    </div>
  );
}

export default Update;
