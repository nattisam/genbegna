const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function readTokens() {
  return {
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken')
  };
}

function storeTokens(access, refresh) {
  if (access) localStorage.setItem('accessToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshToken() {
  const tokens = readTokens();
  if (!tokens.refresh) throw new Error('No refresh token');
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refresh })
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  storeTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function request(path, options = {}, retry = true, tokenOverride) {
  const tokens = readTokens();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = tokenOverride || tokens.access;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401 && retry && tokens.refresh) {
    try {
      const newToken = await refreshToken();
      return request(path, options, false, newToken);
    } catch (err) {
      clearTokens();
    }
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    const err = new Error(error.error || 'Request failed');
    err.status = res.status;
    if (error.reason) err.reason = error.reason;
    throw err;
  }
  return res.json().catch(() => ({}));
}

export async function register(payload) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function login(payload) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }).catch((err) => {
    throw err;
  });
  storeTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function logout() {
  const tokens = readTokens();
  if (!tokens.refresh) return;
  await request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: tokens.refresh })
  }).catch(() => {});
  clearTokens();
}

export async function fetchProfile() {
  return request('/users/me');
}

export async function fetchPermissions() {
  return request('/users/me/permissions');
}

export async function fetchProjects() {
  return request('/projects');
}

export async function createProject(payload) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchProject(id) {
  return request(`/projects/${id}`);
}

export async function updateProject(id, payload) {
  return request(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteProject(id) {
  return request(`/projects/${id}`, { method: 'DELETE' });
}

export async function fetchFiles(projectId) {
  const query = projectId ? `?projectId=${projectId}` : '';
  return request(`/files${query}`);
}

export async function uploadFile(payload) {
  return request('/files', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function removeFile(id) {
  return request(`/files/${id}`, { method: 'DELETE' });
}

export { readTokens, storeTokens, clearTokens };

export async function verifyEmail(token) {
  return request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
}

export async function updateMfaRequired(required) {
  return request('/users/me/update-mfa-required', {
    method: 'POST',
    body: JSON.stringify({ required })
  });
}
