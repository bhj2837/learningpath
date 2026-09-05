/**
 * 화면 전반에서 쓰는 상수 모음.
 *
 * ⚠️ CATEGORIES / LEVELS / RESOURCE_TYPES는 백엔드와 반드시 일치해야 한다.
 *    - CATEGORIES, LEVELS  → backend/roadmaps/models.py (Roadmap.CATEGORY_CHOICES, LEVEL_CHOICES)
 *    - RESOURCE_ICONS 키   → backend/roadmaps/views.py (RESOURCE_TYPES)
 *    한쪽만 바꾸면 생성 요청이 400으로 거절되거나 아이콘이 빠진다.
 */

export const CATEGORIES = ['개발', '디자인', '언어', '비즈니스', '기타']

export const LEVELS = ['입문', '초급', '중급', '고급']

export const DURATION = { min: 2, max: 16, step: 2 }

export const DAILY_HOURS = { min: 0.5, max: 4, step: 0.5 }

export const CATEGORY_COLORS = {
  개발: 'bg-blue-100 text-blue-700',
  디자인: 'bg-pink-100 text-pink-700',
  언어: 'bg-green-100 text-green-700',
  비즈니스: 'bg-amber-100 text-amber-700',
  기타: 'bg-gray-100 text-gray-600',
}

export const DEFAULT_CATEGORY_COLOR = 'bg-gray-100 text-gray-600'

/** 로드맵 상태. value는 백엔드 Roadmap.STATUS_CHOICES와 동일하다. */
export const STATUS_OPTIONS = [
  { value: 'in_progress', label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'completed', label: '완료', color: 'bg-green-100 text-green-700' },
  { value: 'paused', label: '일시중지', color: 'bg-gray-100 text-gray-600' },
]

export const statusInfo = (value) =>
  STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0]

/** 백엔드 _normalize_resources()가 보장하는 type 값만 키로 둔다. */
export const RESOURCE_ICONS = {
  video: '📹',
  article: '📰',
  course: '🎓',
  book: '📚',
  docs: '📄',
}

export const DEFAULT_RESOURCE_ICON = '🔗'

export const GOAL_EXAMPLES = [
  'React로 웹 개발 시작하기',
  'Python으로 데이터 분석 배우기',
  '영어 비즈니스 회화 마스터',
  'UI/UX 디자인 기초 익히기',
  'Django로 백엔드 API 개발',
]
