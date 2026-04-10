import { useEffect, useState } from "react";
import "./App.css";

type Config = {
  text: string;
  availableDatetime: string;
  url: string;
};

function isDatetimeReached(datetimeStr: string): boolean {
  if (!datetimeStr) return false;
  const nyNow = new Date().toLocaleString("sv-SE", {
    timeZone: "America/New_York",
  });
  return nyNow >= datetimeStr.replace("T", " ");
}

function App() {
  const id = new URLSearchParams(window.location.search).get("id");
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/config/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Config>) : Promise.reject()))
      .then(setConfig)
      .catch(() => {}); // stay inactive on error or missing id
  }, [id]);

  const isActive = config !== null && isDatetimeReached(config.availableDatetime);
  const text = config?.text ?? "";

  if (isActive) {
    return (
      <a href={config!.url} className="btn">
        {text}
      </a>
    );
  }
  return <button className="btn">{text}</button>;
}

export default App;
