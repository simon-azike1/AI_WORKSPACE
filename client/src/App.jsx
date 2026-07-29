import { useEffect, useMemo, useState } from 'react';
import { 
  Globe, 
  MessageSquare, 
  Code2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music, 
  Search, 
  Zap, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  ExternalLink,
  FolderOpen
} from 'lucide-react';
import './App.css';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'coding', label: 'Coding', icon: Code2 },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: VideoIcon },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'productivity', label: 'Productivity', icon: Zap },
];

const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-workspace-ry2g.onrender.com/api';

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
            <Plus size={18} />
            Add New Tool
          </button>
        </div>
      </header>

      <section className="search-filter-bar">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search AI tools by name, category..."
            className="search-input"
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="categories-track">
          {CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                className={`category-chip ${activeCat === category.id ? 'active' : ''}`}
                onClick={() => setActiveCat(category.id)}
              >
                <IconComponent size={16} className="chip-icon" />
                <span className="chip-label">{category.label}</span>
                <span className="chip-count">
                  {category.id === 'all' 
                    ? tools.length 
                    : tools.filter(t => t.cat === category.id).length}
                </span>
              </button>
            );
          })}
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
            <div className="empty-icon-wrapper">
              <FolderOpen size={48} className="empty-icon" />
            </div>
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
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="action-btn delete-btn"
                    title="Delete Tool"
                    onClick={() => removeTool(tool._id)}
                  >
                    <Trash2 size={16} />
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
                  <ExternalLink size={14} />
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
            <X size={24} />
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
                    {category.label}
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