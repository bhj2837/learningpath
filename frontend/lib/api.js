const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
};

/**
 * 상태 코드를 잃지 않도록 status를 실어 보낸다.
 * (호출부에서 err.message 문자열로 401을 판별하면 DRF의 {"detail": ...} 응답과
 *  맞지 않아 세션 만료를 놓치게 된다.)
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isAuthError = status === 401 || status === 403;
  }
}

const handleResponse = async (res) => {
  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const raw = data
      ? data.error || data.detail || Object.values(data)[0]
      : `요청에 실패했습니다. (HTTP ${res.status})`;
    const message = Array.isArray(raw) ? raw[0] : raw;
    throw new ApiError(message || `요청에 실패했습니다. (HTTP ${res.status})`, res.status);
  }

  return data;
};

/** 인증 만료 시 토큰을 정리한다. 호출부는 err.isAuthError로 분기하면 된다. */
export const clearSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
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
    }).then(handleResponse),

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
