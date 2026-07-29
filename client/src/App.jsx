import { useEffect, useMemo, useState } from 'react';
import './App.css';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'image', label: 'Image', icon: '🎨' },
  { id: 'video', label: 'Video', icon: '🎬' },
  { id: 'audio', label: 'Audio', icon: '🎵' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [tools, setTools] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [form, setForm] = useState({ name: '', url: '', cat: 'chat', icon: '' });
  const [editingTool, setEditingTool] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Load tools on mount
  useEffect(() => {
    const loadTools = async () => {
      try {
        const response = await fetch(`${API_BASE}/tools`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setTools(data);
        } else {
          setTools([]);
        }
      } catch (err) {
        setError('Unable to reach the API. Running in local demo mode.');
        // Fallback mock data for visual presentation if API is offline
        setTools([
          { _id: '1', name: 'ChatGPT', url: 'https://chat.openai.com', cat: 'chat', icon: 'CG' },
          { _id: '2', name: 'v0.dev', url: 'https://v0.dev', cat: 'coding', icon: 'V0' },
          { _id: '3', name: 'Midjourney', url: 'https://midjourney.com', cat: 'image', icon: 'MJ' },
          { _id: '4', name: 'Runway Gen-3', url: 'https://runwayml.com', cat: 'video', icon: 'RW' },
          { _id: '5', name: 'ElevenLabs', url: 'https://elevenlabs.io', cat: 'audio', icon: 'EL' },
          { _id: '6', name: 'Perplexity AI', url: 'https://perplexity.ai', cat: 'research', icon: 'PX' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, []);

  // Filter tools based on search and category
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

  // Compute category statistics
  const stats = useMemo(() => {
    const total = tools.length;
    const catCounts = tools.reduce((acc, tool) => {
      acc[tool.cat] = (acc[tool.cat] || 0) + 1;
      return acc;
    }, {});
    return { total, catCounts };
  }, [tools]);

  // Form submission for Add or Edit
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name || !form.url) {
      setError('Please add a name and URL.');
      return;
    }

    try {
      if (editingTool) {
        // Edit mode (PUT)
        const response = await fetch(`${API_BASE}/tools/${editingTool._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        let data;
        if (response.ok) {
          data = await response.json();
        } else {
          // Fallback for demo mode if PUT fails/not implemented in backend
          data = { ...editingTool, ...form };
        }

        setTools((current) =>
          current.map((tool) => (tool._id === editingTool._id ? { ...tool, ...form } : tool))
        );
        setEditingTool(null);
      } else {
        // Add mode (POST)
        const response = await fetch(`${API_BASE}/tools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        let data;
        if (response.ok) {
          data = await response.json();
        } else {
          // Fallback mock tool for demo mode
          data = { _id: Date.now().toString(), ...form };
        }

        setTools((current) => [data, ...current]);
      }

      // Reset form and close sidebar
      setForm({ name: '', url: '', cat: 'chat', icon: '' });
      setIsPanelOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save tool.');
    }
  };

  // Set form into edit mode
  const startEdit = (tool) => {
    setEditingTool(tool);
    setForm({
      name: tool.name,
      url: tool.url,
      cat: tool.cat,
      icon: tool.icon || '',
    });
    setIsPanelOpen(true);
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingTool(null);
    setForm({ name: '', url: '', cat: 'chat', icon: '' });
    setIsPanelOpen(false);
  };

  const removeTool = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/tools/${id}`, { method: 'DELETE' });
      if (response.ok || response.status === 404 || response.status === 0) {
        setTools((current) => current.filter((tool) => tool._id !== id));
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback local deletion for demo mode
      setTools((current) => current.filter((tool) => tool._id !== id));
    }
  };

  return (
    <div className="app-shell">
      {/* Background glow effects */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      <header className="dashboard-header">
        <div className="brand-area">
          <span className="badge">MERN Stack</span>
          <h1>AI Hub Launcher</h1>
          <p className="subtitle">Your curated AI tool directory, backed by MongoDB and React.</p>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-label">Total Tools</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">
              {Object.keys(stats.catCounts).length}
            </span>
            <span className="stat-label">Active Categories</span>
          </div>
          <button
            type="button"
            className="btn-primary add-tool-trigger"
            onClick={() => {
              setEditingTool(null);
              setForm({ name: '', url: '', cat: 'chat', icon: '' });
              setIsPanelOpen(true);
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Tool
          </button>
        </div>
      </header>

      <section className="search-filter-bar">
        <div className="search-wrapper">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search AI tools by name, category..."
            className="search-input"
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className="categories-track">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`category-chip ${activeCat === category.id ? 'active' : ''}`}
              onClick={() => setActiveCat(category.id)}
            >
              <span className="chip-emoji">{category.icon}</span>
              <span className="chip-label">{category.label}</span>
              <span className="chip-count">
                {category.id === 'all' 
                  ? tools.length 
                  : tools.filter(t => t.cat === category.id).length}
              </span>
            </button>
          ))}
        </div>
      </section>

      <main className="main-content">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading curated tools...</p>
          </div>
        )}

        {error && <div className="error-toast">{error}</div>}

        {!loading && visibleTools.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No tools found</h3>
            <p>Try searching for something else or add a new tool to get started.</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearch('');
                setActiveCat('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        <div className="tools-grid">
          {visibleTools.map((tool) => (
            <article className={`tool-card-premium ${editingTool?._id === tool._id ? 'is-editing' : ''}`} key={tool._id}>
              <div className="card-glass-glow"></div>
              
              <div className="tool-card-header">
                <div className="tool-icon-wrapper">
                  {tool.icon ? (
                    <span className="tool-avatar-text">{tool.icon.slice(0, 2).toUpperCase()}</span>
                  ) : (
                    <span className="tool-avatar-text">{tool.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                
                <div className="action-buttons">
                  <button
                    type="button"
                    className="action-btn edit-btn"
                    title="Edit Tool"
                    onClick={() => startEdit(tool)}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="action-btn delete-btn"
                    title="Delete Tool"
                    onClick={() => removeTool(tool._id)}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="tool-card-body">
                <h3>{tool.name}</h3>
                <span className={`category-tag tag-${tool.cat}`}>
                  {CATEGORIES.find((c) => c.id === tool.cat)?.label || tool.cat}
                </span>
                <p className="tool-url-preview">{tool.url.replace(/^https?:\/\/(www\.)?/, '')}</p>
              </div>

              <div className="tool-card-footer">
                <a href={tool.url} target="_blank" rel="noreferrer" className="launch-link">
                  <span>Launch Tool</span>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Slide-out Sidebar Panel */}
      <div className={`sidebar-backdrop ${isPanelOpen ? 'is-visible' : ''}`} onClick={cancelEdit}></div>
      <aside className={`sidebar-drawer ${isPanelOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <h2>{editingTool ? 'Edit AI Tool' : 'Add AI Tool'}</h2>
          <button type="button" className="close-sidebar-btn" onClick={cancelEdit}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form className="sidebar-form" onSubmit={handleSubmit}>
          {error && <div className="form-error-banner">{error}</div>}

          <div className="form-group">
            <label htmlFor="tool-name">Tool Name</label>
            <input
              id="tool-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Midjourney"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tool-url">Website URL</label>
            <input
              id="tool-url"
              type="url"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tool-category">Category</label>
            <div className="select-wrapper">
              <select
                id="tool-category"
                value={form.cat}
                onChange={(event) => setForm({ ...form, cat: event.target.value })}
              >
                {CATEGORIES.filter((category) => category.id !== 'all').map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} &nbsp; {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tool-icon">Custom Avatar Initials (Optional)</label>
            <input
              id="tool-icon"
              value={form.icon}
              onChange={(event) => setForm({ ...form, icon: event.target.value })}
              placeholder="e.g. MJ"
              maxLength="2"
            />
            <span className="field-hint">Max 2 characters. If blank, initials will be generated automatically.</span>
          </div>

          <div className="form-actions">
            {editingTool && (
              <button type="button" className="btn-cancel" onClick={cancelEdit}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-submit">
              {editingTool ? 'Save Changes' : 'Add Tool'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default App;