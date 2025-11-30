import { useState } from 'react';

function DashboardPage({
  projects,
  canCreate,
  onCreate,
  onSelect,
  loading,
  error
}) {
  const [draft, setDraft] = useState({
    name: '',
    status: 'draft',
    location: '',
    classification: 1
  });

  function submit(e) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onCreate(draft);
    setDraft({ ...draft, name: '' });
  }

  return (
    <section className="panel">
      <h2>Projects</h2>
      {error && <div className="note">{error}</div>}
      {canCreate && (
        <form className="inline-form" onSubmit={submit}>
          <input
            placeholder="New project name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <select
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={draft.classification}
            onChange={(e) =>
              setDraft({ ...draft, classification: Number(e.target.value) })
            }
          >
            <option value={1}>Public</option>
            <option value={2}>Internal</option>
            <option value={3}>Confidential</option>
          </select>
          <button type="submit">Create</button>
        </form>
      )}
      <div className="grid">
        {projects.map((project) => (
          <article
            key={project.id}
            className="card"
            onClick={() => onSelect(project)}
          >
            <h3>{project.name}</h3>
            <p>Status: {project.status}</p>
            <p>Location: {project.location || 'N/A'}</p>
            <p>Class: {project.classification}</p>
            <p>Dept: {project.department || 'general'}</p>
          </article>
        ))}
        {!projects.length && !loading && <p>No projects yet.</p>}
      </div>
    </section>
  );
}

export default DashboardPage;

