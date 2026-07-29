import { useEffect, useMemo, useState } from 'react';
import './App.css';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'chat', label: 'Chat' },
  { id: 'coding', label: 'Coding' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'research', label: 'Research' },
  { id: 'productivity', label: 'Productivity' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [tools, setTools] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [form, setForm] = useState({ name: '', url: '', cat: 'chat', icon: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTools = async () => {
      try {
        const response = await fetch(`${API_BASE}/tools`);
        const data = await response.json();
        setTools(data);
      } catch (err) {
        setError('Unable to reach the API. Start the backend server first.');
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, []);

  const visibleTools = useMemo(() => {
    const query = search.toLowerCase();
    return tools.filter((tool) => {
      const matchesCat = activeCat === 'all' || tool.cat === activeCat;
      const matchesQuery =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.cat.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });
  }, [activeCat, search, tools]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name || !form.url) {
      setError('Please add a name and URL.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save tool.');
      }

      setTools((current) => [data, ...current]);
      setForm({ name: '', url: '', cat: 'chat', icon: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const removeTool = async (id) => {
    try {
      await fetch(`${API_BASE}/tools/${id}`, { method: 'DELETE' });
      setTools((current) => current.filter((tool) => tool._id !== id));
    } catch (err) {
      setError('Unable to delete the tool right now.');
    }
  };

  return (
    <div className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">MERN Launchpad / AI Tools</p>
        <h1>Your AI tools, one click away</h1>
        <p className="subtext">
          Search, browse, and save AI tools in a database-backed dashboard built with React, Express, and MongoDB.
        </p>
      </header>

      <section className="controls-card">
        <div className="search-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tools by name or category"
          />
        </div>

        <div className="chip-row">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip ${activeCat === category.id ? 'active' : ''}`}
              onClick={() => setActiveCat(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <form className="form-card" onSubmit={handleSubmit}>
          <h2>Add a new tool</h2>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Runway"
            />
          </label>
          <label>
            URL
            <input
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://runwayml.com"
            />
          </label>
          <label>
            Category
            <select
              value={form.cat}
              onChange={(event) => setForm({ ...form, cat: event.target.value })}
            >
              {CATEGORIES.filter((category) => category.id !== 'all').map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Icon
            <input
              value={form.icon}
              onChange={(event) => setForm({ ...form, icon: event.target.value })}
              placeholder="R"
              maxLength="2"
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit">Save tool</button>
        </form>

        <div className="tools-panel">
          {loading ? <p>Loading tools...</p> : null}
          {!loading && visibleTools.length === 0 ? <p>No tools match that search yet.</p> : null}
          {visibleTools.map((tool) => (
            <article className="tool-card" key={tool._id}>
              <div className="tool-top">
                <div className="tool-icon">{tool.icon || tool.name[0]}</div>
                <button type="button" onClick={() => removeTool(tool._id)}>
                  ×
                </button>
              </div>
              <h3>{tool.name}</h3>
              <p>{tool.cat}</p>
              <a href={tool.url} target="_blank" rel="noreferrer">
                Open tool
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
