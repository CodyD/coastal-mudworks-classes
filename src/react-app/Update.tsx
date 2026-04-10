import { useEffect, useState } from "react";
import "./Update.css";

type Config = {
  text: string;
  availableDatetime: string;
  url: string;
};

type ConfigMap = Record<string, Config>;

const empty = (): { id: string } & Config => ({
  id: "",
  text: "",
  availableDatetime: "",
  url: "",
});

function Admin() {
  const [configs, setConfigs] = useState<ConfigMap>({});
  const [form, setForm] = useState(empty());
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadConfigs();
  }, []);

  function loadConfigs() {
    fetch("/api/configs")
      .then((r) => (r.ok ? (r.json() as Promise<ConfigMap>) : Promise.reject()))
      .then(setConfigs)
      .catch(() => setStatus("Could not load buttons — are you signed in?"));
  }

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const { id, ...config } = form;
    if (!id.trim()) {
      setStatus("Button ID is required.");
      return;
    }
    const res = await fetch(`/api/config/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      setStatus(`Saved "${id}".`);
      setForm(empty());
      loadConfigs();
    } else {
      setStatus("Save failed.");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/config/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setStatus(`Deleted "${id}".`);
      if (form.id === id) setForm(empty());
      loadConfigs();
    } else {
      setStatus("Delete failed.");
    }
  }

  const isEditing = !!form.id && !!configs[form.id];

  return (
    <div className="update">
      <h1>Button Admin</h1>

      <section>
        <h2>{isEditing ? `Editing "${form.id}"` : "New Button"}</h2>
        <form onSubmit={handleSave}>
          <label>
            Button ID
            <input
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              placeholder="e.g. spring-class-2025"
              disabled={isEditing}
              required
            />
          </label>
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
            Available Date / Time{" "}
            <span className="tz">(Eastern Time)</span>
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
          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={() => { setForm(empty()); setStatus(""); }}>
              Clear
            </button>
          </div>
        </form>
        {status && <p className="status">{status}</p>}
      </section>

      <section>
        <h2>Configured Buttons</h2>
        {Object.keys(configs).length === 0 ? (
          <p className="empty">No buttons yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Text</th>
                <th>Available (ET)</th>
                <th>URL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(configs).map(([id, cfg]) => (
                <tr key={id}>
                  <td>
                    <code>{id}</code>
                  </td>
                  <td>{cfg.text}</td>
                  <td>{cfg.availableDatetime}</td>
                  <td>
                    <a href={cfg.url} target="_blank" rel="noopener noreferrer">
                      {cfg.url}
                    </a>
                  </td>
                  <td className="row-actions">
                    <button onClick={() => setForm({ id, ...cfg })}>Edit</button>
                    <button onClick={() => handleDelete(id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Admin;
