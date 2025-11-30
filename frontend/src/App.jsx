import { useEffect, useState } from 'react';
import NavBar from './components/NavBar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import MfaPage from './pages/MfaPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AccessPage from './pages/AccessPage.jsx';
import {
  login,
  register,
  logout,
  fetchProfile,
  fetchPermissions,
  fetchProjects,
  fetchFiles,
  createProject,
  uploadFile,
  removeFile,
  verifyEmail,
  updateMfaRequired
} from './api';

function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsMfa, setNeedsMfa] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accessReason, setAccessReason] = useState('');

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      await hydrate();
      setView('dashboard');
    } catch (err) {
      // ignore until user logs in
    }
  }

  function can(action) {
    return permissions.includes(action);
  }

  async function hydrate() {
    const profile = await fetchProfile();
    setUser(profile);
    const perms = await fetchPermissions();
    setPermissions(perms.actions || []);
    const list = await fetchProjects();
    setProjects(list);
  }

  function handleApiError(err) {
    if (err.status === 403) {
      setAccessReason(err.reason || '');
      setAccessBlocked(true);
      setError('');
      return;
    }
    setError(err.message || 'Request failed');
  }

  async function handleLogin(form) {
    setLoading(true);
    setError('');
    try {
      const payload = {
        email: form.email,
        password: form.password
      };
      if (form.token) payload.token = form.token;
      const res = await login(payload);
      setUser(res.user);
      await hydrate();
      setNeedsMfa(false);
      setPendingLogin(null);
      setView('dashboard');
    } catch (err) {
      if (err.message === 'MFA required') {
        setPendingLogin({ email: form.email, password: form.password });
        setNeedsMfa(true);
        setView('mfa');
        setError('');
      } else {
        handleApiError(err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa({ token }) {
    if (!pendingLogin) return;
    await handleLogin({ ...pendingLogin, token });
  }

  async function handleRegister(form) {
    setLoading(true);
    setError('');
    try {
      const data = await register(form);
      setView('login');
      setError(
        data.verifyToken
          ? `Account created. Verify token: ${data.verifyToken}`
          : 'Account created. You can log in now.'
      );
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles(projectId) {
    try {
      const data = await fetchFiles(projectId);
      setFiles(data);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleSelectProject(project) {
    setSelectedProject(project);
    setView('project');
    await loadFiles(project.id);
  }

  async function handleCreateProject(data) {
    try {
      await createProject(data);
      const refreshed = await fetchProjects();
      setProjects(refreshed);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleUploadFile(payload) {
    try {
      await uploadFile(payload);
      await loadFiles(payload.projectId);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleRemoveFile(id) {
    try {
      await removeFile(id);
      if (selectedProject) await loadFiles(selectedProject.id);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setPermissions([]);
    setProjects([]);
    setFiles([]);
    setSelectedProject(null);
    setView('login');
    setError('');
    setNeedsMfa(false);
    setPendingLogin(null);
    setAccessBlocked(false);
    setAccessReason('');
  }

  async function handleToggleMfaRequired() {
    if (!user) return;
    try {
      const updated = await updateMfaRequired(!(user?.mfa_required ?? false));
      setUser(updated);
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleVerifyEmail(token) {
    try {
      const res = await verifyEmail(token);
      setUser(res.user);
      setError('Email verified.');
    } catch (err) {
      handleApiError(err);
    }
  }

  function go(viewName) {
    setView(viewName);
    if (viewName !== 'project') {
      setSelectedProject(null);
    }
  }

  function renderPage() {
    if (accessBlocked) {
      return (
        <AccessPage
          reason={accessReason}
          onBack={() => {
            setAccessBlocked(false);
            setAccessReason('');
          }}
        />
      );
    }

    if (!user) {
      if (view === 'register') {
        return (
          <RegisterPage
            onSubmit={handleRegister}
            loading={loading}
            error={error}
          />
        );
      }
      if (needsMfa || view === 'mfa') {
        return (
          <MfaPage
            email={pendingLogin?.email}
            onSubmit={handleMfa}
            loading={loading}
            error={error}
          />
        );
      }
      return (
        <LoginPage
          onSubmit={handleLogin}
          loading={loading}
          error={error}
          needsMfa={needsMfa}
        />
      );
    }

    if (view === 'profile') {
      return (
        <ProfilePage
          user={user}
          permissions={permissions}
          onToggleMfa={handleToggleMfaRequired}
          onVerifyEmail={handleVerifyEmail}
        />
      );
    }

    if (view === 'project' && selectedProject) {
      return (
        <ProjectPage
          project={selectedProject}
          files={files}
          canUpload={can('files:create')}
          canDelete={can('files:delete')}
          onBack={() => go('dashboard')}
          onUpload={handleUploadFile}
          onDelete={handleRemoveFile}
        />
      );
    }

    return (
      <DashboardPage
        projects={projects}
        canCreate={can('projects:create')}
        onCreate={handleCreateProject}
        onSelect={handleSelectProject}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="app-shell">
      <NavBar user={user} onNav={go} onLogout={handleLogout} />
      {user && !user.email_verified && (
        <div className="note warning">
          Email not verified. Enter your token under Profile.
        </div>
      )}
      {renderPage()}
    </div>
  );
}

export default App;
