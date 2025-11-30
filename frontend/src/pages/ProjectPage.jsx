import { useState } from 'react';

function ProjectPage({
  project,
  files,
  canUpload,
  canDelete,
  onBack,
  onUpload,
  onDelete
}) {
  const [draft, setDraft] = useState({
    name: '',
    type: '',
    size: 0,
    classification: project.classification
  });

  function submit(e) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onUpload({
      projectId: project.id,
      name: draft.name,
      type: draft.type,
      size: Number(draft.size),
      classification: Number(draft.classification)
    });
    setDraft({
      name: '',
      type: '',
      size: 0,
      classification: project.classification
    });
  }

  return (
    <section className="panel">
      <button className="ghost" onClick={onBack}>
        ← Projects
      </button>
      <h2>{project.name}</h2>
      <div className="details">
        <p>Status: {project.status}</p>
        <p>Location: {project.location || 'N/A'}</p>
        <p>Classification: {project.classification}</p>
        <p>Contractor: {project.contractor || 'n/a'}</p>
        <p>Finance: {project.finance || 'n/a'}</p>
        <p>Department: {project.department || 'general'}</p>
      </div>

      <h3>Files</h3>
      {canUpload && (
        <form className="inline-form" onSubmit={submit}>
          <input
            placeholder="Blueprint name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            placeholder="Type"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          />
          <input
            type="number"
            placeholder="Size"
            value={draft.size}
            onChange={(e) => setDraft({ ...draft, size: e.target.value })}
          />
          <select
            value={draft.classification}
            onChange={(e) =>
              setDraft({ ...draft, classification: e.target.value })
            }
          >
            <option value={1}>Public</option>
            <option value={2}>Internal</option>
            <option value={3}>Confidential</option>
          </select>
          <button type="submit">Upload</button>
        </form>
      )}
      <ul className="file-list">
        {files.map((file) => (
          <li key={file.id}>
            <div>
              <strong>{file.name}</strong> ({file.type || 'file'}) —{' '}
              {file.size || 0}kb
            </div>
            {canDelete && (
              <button onClick={() => onDelete(file.id)}>Remove</button>
            )}
          </li>
        ))}
        {!files.length && <p>No files attached.</p>}
      </ul>
    </section>
  );
}

export default ProjectPage;

