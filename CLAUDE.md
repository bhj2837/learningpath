러닝패스(LearningPath) 프로젝트 - 전체 컨텍스트

## 프로젝트 개요
AI(Claude Haiku) 기반 개인 맞춤 학습 로드맵 자동 생성 플랫폼. 사용자가 목표, 기간, 수준을 입력하면 30초 만에 주차별 학습계획, 자료, 체크리스트를 자동 생성.

## 개발 환경
- OS: Windows 11
- 에디터: Cursor AI
- 터미널: Git Bash + PowerShell
- 언어: Python 3.x
- 프레임워크: Django 5.0 + Django REST Framework
- DB: SQLite (개발용)
- AI: Claude API (anthropic 패키지, claude-3-haiku-20240307 모델)
- 버전 관리: Git + GitHub

## 프로젝트 구조
learningpath/
├── backend/
│   ├── config/
│   │   ├── settings.py (Django 설정, dotenv 로드 구현)
│   │   ├── urls.py (메인 URL)
│   │   └── wsgi.py
│   ├── roadmaps/
│   │   ├── models.py (4개 모델: Roadmap, Week, Checklist, Progress)
│   │   ├── serializers.py (DRF Serializers)
│   │   ├── views.py (ViewSets + generate 액션, ⚠️ API 키 하드코딩 있음)
│   │   ├── urls.py (API 엔드포인트)
│   │   └── admin.py (Admin 페이지 설정)
│   ├── .env (환경변수: ANTHROPIC_API_KEY 포함, gitignore됨)
│   ├── manage.py
│   ├── db.sqlite3 (테스트 데이터 3개)
│   ├── venv/ (Python 가상환경)
│   └── requirements.txt
├── .gitignore (.env, venv, *.pyc 등)
└── README.md

## 설치된 주요 패키지
Django==5.0.x, djangorestframework, django-cors-headers, python-dotenv, anthropic, psycopg2-binary

## 데이터 모델 (4개)

1. Roadmap: user(FK), title, goal, category(개발/디자인/언어), duration_weeks, daily_hours, current_level, status(in_progress/completed/paused), created_at, updated_at

2. Week: roadmap(FK), week_number, title, description, estimated_hours, resources(JSONField: [{title, url, type}]), project_suggestion

3. Checklist: week(FK), content, is_completed(default=False), completed_at(nullable)

4. Progress: roadmap(FK), date, hours_studied, notes

## API 엔드포인트
- GET/POST /api/roadmaps/roadmaps/
- GET/PUT/DELETE /api/roadmaps/roadmaps/{id}/
- POST /api/roadmaps/roadmaps/generate/ (⭐ AI 생성)

generate 입력 예시:
{
  "goal": "React 배우기",
  "category": "개발",
  "duration_weeks": 4,
  "daily_hours": 2,
  "current_level": "초급"
}

## Claude API 연동 (views.py의 generate 메서드)
- @action(detail=False, methods=['post']) 데코레이터 사용
- ⚠️ 현재 문제: API_KEY = "***REVOKED-API-KEY-REMOVED***" 하드코딩됨
- ✅ 수정 필요: client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
- 프롬프트: "당신은 학습 로드맵 전문가입니다" + 사용자 입력 정보 → JSON 생성 요청
- 응답 파싱 후 Roadmap, Week, Checklist 객체 자동 생성

## 환경변수 (.env 파일, 위치: backend/.env)
ANTHROPIC_API_KEY=***REVOKED-API-KEY-REMOVED***
DJANGO_SECRET_KEY=dev-secret-key
DEBUG=True

## 완료된 작업 (60%)
✅ Django 프로젝트 구조 완성
✅ 4개 모델 설계 및 마이그레이션
✅ Admin 페이지 설정 (슈퍼유저: admin/***REMOVED***)
✅ REST API 구축 (ModelViewSet, Serializers)
✅ CORS 설정
✅ Claude API 연동 (generate 엔드포인트)
✅ 프롬프트 엔지니어링
✅ JSON 파싱 및 DB 저장 로직
✅ 테스트 성공: "React 배우기" 입력 시 4주차 커리큘럼 생성 (HTTP 201, 4개 Week, 12개 Checklist, 실제 URL 학습자료, 프로젝트 제안 포함)

해결한 문제:
- python-dotenv 로드 실패 → settings.py에서 직접 .env 파일 읽기
- Claude API 404 에러 → test_claude.py로 모델 테스트, claude-3-haiku-20240307만 작동 확인
- API 키 인증 실패 → 하드코딩으로 임시 해결 (⚠️ 현재 문제)

## ⚠️ 현재 상태: Git Push 차단됨
- git push origin main 시 GitHub Secret Scanning이 코드 내 하드코딩된 API 키 감지
- Push 자동 차단 (코드는 GitHub에 올라가지 않음, API 키 노출 안 됨)
- 감지된 파일: backend/config/settings.py:169, backend/roadmaps/views.py:46

해야 할 것:
1. backend/roadmaps/views.py: API_KEY = "sk-ant-..." 삭제, client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))로 변경
2. backend/config/settings.py: 하드코딩된 ANTHROPIC_API_KEY 줄 삭제
3. .gitignore 확인 (*.env, backend/.env 포함)
4. git add . → git commit -m "refactor: API 키 환경변수로 변경" → git push origin main

## 미완료 작업 (40%)
Frontend (Next.js): 프로젝트 생성, 홈 페이지, 로드맵 생성/목록/상세 페이지, API 연동, UI/UX
통합 & 배포: Frontend-Backend 연동 테스트, 배포 준비

## 테스트 결과 (성공 사례)
입력: POST /api/roadmaps/roadmaps/generate/
{"goal": "React 배우기", "category": "개발", "duration_weeks": 4, "daily_hours": 2, "current_level": "초급"}

출력: {"id": 3, "title": "React 배우기", "weeks": [{"week_number": 1, "title": "React 기초 이해하기", "description": "...", "estimated_hours": 10, "resources": [{"title": "React 공식 문서", "url": "https://reactjs.org/docs/getting-started.html", "type": "text"}], "project_suggestion": "간단한 Counter 앱", "checklists": [{"content": "React 기본 개념 이해", "is_completed": false}, ...]}]} (4주차까지)

## 서버 실행
cd C:\Users\user\Documents\learningpath\backend
venv\Scripts\activate
python manage.py runserver
브라우저: http://localhost:8000/api/roadmaps/roadmaps/

## Git 정보
로컬: C:\Users\user\Documents\learningpath
리모트: https://github.com/bhj2837/learningpath.git
브랜치: main

## 다음 할 일
1순위 (5분): views.py, settings.py에서 API 키 하드코딩 제거 → git push
2순위 (3-4시간): Next.js Frontend 개발

## 중요 정보
- API 키는 .env에만 존재 (노출 안 됨)
- Free tier: claude-3-haiku-20240307만 가능
- 로드맵 생성: 약 30초
- 테스트 데이터: 3개 Roadmap