const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    const message = data.error || data.detail || Object.values(data)[0] || '요청에 실패했습니다.';
    throw new Error(Array.isArray(message) ? message[0] : message);
  }
  return data;
};

export const api = {
  // ── 인증 ──────────────────────────────────────────
  register: (username, email, password) =>
    fetch(`${API_BASE}/api/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    }).then(handleResponse),

  login: (username, password) =>
    fetch(`${API_BASE}/api/users/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handleResponse),

  logout: () =>
    fetch(`${API_BASE}/api/users/logout/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),

  getProfile: () =>
    fetch(`${API_BASE}/api/users/profile/`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  // ── 로드맵 ─────────────────────────────────────────
  getRoadmaps: () =>
    fetch(`${API_BASE}/api/roadmaps/roadmaps/`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  getRoadmap: (id) =>
    fetch(`${API_BASE}/api/roadmaps/roadmaps/${id}/`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  generateRoadmap: (data) =>
    fetch(`${API_BASE}/api/roadmaps/roadmaps/generate/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteRoadmap: (id) =>
    fetch(`${API_BASE}/api/roadmaps/roadmaps/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then((res) => {
      if (!res.ok) throw new Error('삭제에 실패했습니다.');
      return true;
    }),

  updateRoadmapStatus: (id, status) =>
    fetch(`${API_BASE}/api/roadmaps/roadmaps/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    }).then(handleResponse),

  // ── 체크리스트 ─────────────────────────────────────
  toggleChecklist: (id) =>
    fetch(`${API_BASE}/api/roadmaps/checklists/${id}/toggle_complete/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).then(handleResponse),
};
