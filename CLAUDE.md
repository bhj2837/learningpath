# 러닝패스(LearningPath) — 프로젝트 컨텍스트

## 개요
Claude API 기반 개인 맞춤 학습 로드맵 자동 생성 플랫폼.
목표·기간·수준을 입력하면 주차별 학습계획, 학습자료, 실습 프로젝트, 체크리스트를 자동 생성한다.

## 기술 스택
- Backend: Python 3.11 / Django 5.2 / Django REST Framework
- Frontend: Next.js 14 (App Router, JavaScript) / Tailwind CSS
- DB: SQLite(개발) / PostgreSQL(운영, `DATABASE_URL`로 전환)
- AI: Anthropic Claude API (`anthropic` 패키지)
- 배포: Railway(백엔드) / Vercel(프론트엔드)

## 디렉터리 구조
```
learningpath/
├── backend/
│   ├── config/          # settings, urls, wsgi
│   ├── roadmaps/        # Roadmap / Week / Checklist
│   ├── users/           # 회원가입·로그인·프로필 (Token 인증)
│   ├── manage.py
│   ├── Procfile
│   ├── pyproject.toml   # ruff 설정
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── components/  # Header 등 공용 컴포넌트
│   │   └── ...          # /, /auth, /create, /dashboard, /roadmaps/[id]
│   └── lib/
│       ├── api.js       # API 클라이언트 (ApiError로 status 전달)
│       ├── constants.js # 카테고리·수준·상태·자료 아이콘 (백엔드와 동기화 필요)
│       └── useAuth.js   # useRequireAuth / useIsLoggedIn
├── .github/workflows/ci.yml
├── .editorconfig        # UTF-8 / LF 고정 (아래 주의사항 1번 재발 방지)
├── .env.example         # 환경변수 템플릿 (실제 .env는 커밋 금지)
├── railway.toml
└── README.md
```

## 데이터 모델
| 모델 | 주요 필드 |
|---|---|
| `Roadmap` | user(FK), title, goal, category, duration_weeks, daily_hours, current_level, status |
| `Week` | roadmap(FK), week_number, title, description, estimated_hours, resources(JSON), project_suggestion |
| `Checklist` | week(FK), content, is_completed, completed_at |

`Week`는 `(roadmap, week_number)` 유니크 제약이 걸려 있다.
진도는 별도 모델 없이 `Checklist.is_completed` 집계로만 계산한다.

### 백엔드 ↔ 프론트 동기화 지점
아래 세 쌍은 한쪽만 바꾸면 **런타임에 조용히 깨진다**. 함께 수정할 것.

| 백엔드 | 프론트 | 어긋나면 |
|---|---|---|
| `Roadmap.CATEGORY_CHOICES` | `constants.js` `CATEGORIES` | 생성 요청이 400 |
| `Roadmap.LEVEL_CHOICES` | `constants.js` `LEVELS` | 생성 요청이 400 |
| `views.RESOURCE_TYPES` | `constants.js` `RESOURCE_ICONS` | 자료 아이콘 누락 |

## API 엔드포인트
```
POST   /api/users/register/                          회원가입 (인증 불필요)
POST   /api/users/login/                             로그인 (인증 불필요)
POST   /api/users/logout/
GET    /api/users/profile/

GET    /api/roadmaps/roadmaps/                       내 로드맵 목록
POST   /api/roadmaps/roadmaps/generate/              AI 로드맵 생성 (throttle: 10/시간)
GET    /api/roadmaps/roadmaps/{id}/
PATCH  /api/roadmaps/roadmaps/{id}/
DELETE /api/roadmaps/roadmaps/{id}/

POST   /api/roadmaps/checklists/{id}/toggle_complete/

GET    /healthz/                                     헬스체크 (인증 불필요)
```

모든 `roadmaps` 계열 ViewSet은 **요청자 소유 데이터만** 반환하도록 `get_queryset()`에서 필터링한다.
신규 ViewSet 추가 시 이 규칙을 반드시 지킬 것.

## 환경변수
`.env.example`를 복사해 `.env`를 만들고 값을 채운다. **`.env`는 절대 커밋하지 않는다.**

| 변수 | 필수 | 설명 |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Anthropic 콘솔에서 발급 |
| `DJANGO_SECRET_KEY` | 운영 필수 | `DJANGO_DEBUG=False`면 미설정 시 기동 실패 |
| `DJANGO_DEBUG` | | 기본값 `False`. 로컬에서만 `True` |
| `ALLOWED_HOSTS` | 운영 필수 | 쉼표 구분 |
| `CORS_ALLOWED_ORIGINS` | | 쉼표 구분 |
| `DATABASE_URL` | | 미설정 시 SQLite |
| `ANTHROPIC_MODEL` | | 기본값 `claude-haiku-4-5` |

프론트엔드는 `NEXT_PUBLIC_API_URL`로 백엔드 주소를 지정한다.

## 로컬 실행
```bash
# 백엔드
cd backend
python -m venv venv && source venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 프론트엔드
cd frontend
npm install
npm run dev
```

## 테스트 · 린트
```bash
cd backend && python manage.py test        # 34개
cd backend && ruff check .                 # pip install ruff
cd frontend && npm run lint
```
CI(`.github/workflows/ci.yml`)가 위 검사에 더해 BOM/UTF-16 검출, 시크릿 패턴 검사,
`makemigrations --check`, `check --deploy`를 함께 돌린다.

## ⚠️ 이 저장소의 주의사항 (과거 사고 이력)

1. **`.gitignore` / `requirements.txt`는 반드시 UTF-8(BOM 없음)으로 저장할 것.**
   PowerShell의 `>` 리다이렉트와 `Set-Content` 기본 인코딩은 UTF-16LE다.
   Git은 UTF-16 `.gitignore`를 파싱하지 못해 **모든 무시 규칙이 무효화**되고,
   pip는 UTF-16 `requirements.txt`를 읽지 못해 배포가 실패한다.
   실제로 이 문제로 `venv/` 17,581개 파일과 `.env`가 커밋된 이력이 있다.
   현재는 `.editorconfig`와 CI의 BOM 검사가 재발을 막는다.

2. **시크릿을 코드·문서에 절대 적지 말 것.** 과거 이 파일과 `.env`에
   실제 API 키가 평문으로 커밋·푸시된 적이 있다(해당 키는 폐기됨).
   설정값을 로그로 출력하는 `print()`도 금지한다.

3. **커밋 전 `git status`로 추적 파일 수를 확인할 것.** 정상 상태의 추적 파일은 약 40개다.
