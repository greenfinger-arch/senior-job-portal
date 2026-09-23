Decap CMS 구축 및 Cloudflare Workers 기반 GitHub OAuth 연동 청사진(Blue-Print) 보고서입니다.

---

# Decap CMS & Cloudflare Worker 기반 정적 포털 청사진

## 1. 아키텍처 개요 (Architecture Overview)

```
[사용자/관리자 브라우저]
       │
       ├─► [Decap CMS Admin UI] (senior-job-portal.pages.dev/admin/)
       │          │
       │          ├─► [OAuth 인증 요청] ──► [Cloudflare Worker]
       │          │                             │ (black-sun-634d...workers.dev)
       │          │                             ▼
       │          │                     [GitHub OAuth API] (Token 발급)
       │          │
       │          └─► [Markdown Content (.md) Commit/Push]
       │                                │
       ▼                                ▼
[Cloudflare Pages] ◄─── (Auto Build) ─── [GitHub Repository]
 (Jamstack 웹사이트)                       (greenfinger-arch/senior-job)

```

---

## 2. 주요 구성요소 및 환경 정보

| 분류 | 항목 | 설정값 / 정보 |
| --- | --- | --- |
| **Hosting** | Cloudflare Pages | `[https://senior-job-portal.pages.dev/](https://senior-job-portal.pages.dev/)` |
| **Repository** | GitHub Repo | `greenfinger-arch/senior-job` (Branch: `main`) |
| **CMS** | Decap CMS | Version 3.x (`/admin/index.html`) |
| **Auth Proxy** | Cloudflare Worker | `[https://black-sun-634d.garcia47stand.workers.dev](https://black-sun-634d.garcia47stand.workers.dev)` |
| **OAuth Scope** | GitHub Application | OAuth App Name: `시니어내일포럼 CMS` |

---

## 3. 세부 파일 및 소스코드 명세

### ① `admin/index.html` (CMS 관리자 엔트리)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>시니어내일포럼 - 관리자 시스템</title>
</head>
<body>
  <!-- Decap CMS 코어 스크립트 -->
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>

```

### ② `admin/config.yml` (CMS 설정 파일)

```yaml
backend:
  name: github
  repo: greenfinger-arch/senior-job
  branch: main
  base_url: https://black-sun-634d.garcia47stand.workers.dev
  auth_endpoint: /auth

site_url: https://senior-job-portal.pages.dev/
display_url: https://senior-job-portal.pages.dev/

media_folder: "images/uploads"
public_folder: "/images/uploads"

collections:
  - name: "posts"
    label: "기사/콘텐츠"
    folder: "posts"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - { label: "제목", name: "title", widget: "string" }
      - { 
          label: "카테고리", 
          name: "category", 
          widget: "select", 
          options: ["시니어 재취업", "중장년 부업/N잡", "교육/자격증", "정부 지원금"] 
        }
      - { label: "발행일", name: "date", widget: "datetime", format: "YYYY-MM-DD" }
      - { label: "대표 이미지", name: "thumbnail", widget: "image", required: false }
      - { label: "요약문", name: "excerpt", widget: "text" }
      - { label: "본문 내용", name: "body", widget: "markdown" }

```

### ③ Cloudflare Worker 코드 (`index.js`)

* **Environment Variables (환경 변수)**:
* `GITHUB_CLIENT_ID`: GitHub OAuth App에서 발급받은 Client ID
* `GITHUB_CLIENT_SECRET`: GitHub OAuth App에서 발급받은 Client Secret (Secret 설정)



```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Auth 요청 시 GitHub OAuth 로그인 페이지로 리다이렉트
    if (url.pathname === '/auth') {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo,user`;
      return Response.redirect(authUrl, 302);
    }

    // 2. GitHub 콜백 수신 및 Access Token 교환
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing code parameter', { status: 400 });
      }

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Decap-CMS-Cloudflare-Worker'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code
        })
      });

      const data = await response.json();

      if (data.error) {
        return new Response(`OAuth Error: ${data.error_description || data.error}`, { status: 400 });
      }

      // 3. PostMessage를 이용해 Decap CMS 팝업창으로 토큰 전송
      const content = `
        <script>
          const token = "${data.access_token}";
          const provider = "github";
          if (window.opener) {
            window.opener.postMessage(
              'authorizing:' + provider,
              '*'
            );
            window.opener.postMessage(
              'authorization:' + provider + ':success:' + JSON.stringify({ token: token, provider: provider }),
              '*'
            );
          }
        </script>
      `;

      return new Response(content, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    return new Response('Decap CMS OAuth Provider for Cloudflare Workers', { status: 200 });
  }
};

```

### ④ Front-end Script (`index.html` 하단 스크립트 구성을 포함)

```html
  <!-- 모바일 메뉴 동작 스크립트 -->
  <script>
    document.getElementById('menuToggle').addEventListener('click', function() {
      document.getElementById('mainNav').classList.toggle('open');
    });
  </script>

  <!-- YAML 파서 및 GitHub 연동 스크립트 -->
  <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
  <script src="js/app.js"></script>
</body>
</html>

```

---

## 4. 트러블슈팅 및 운영 가이드 (Troubleshooting)

1. **404 Repo Not Found 발생 시**
* `config.yml` 내 `repo: greenfinger-arch/senior-job` 대소문자 및 오타 확인
* GitHub 계정 설정([Authorized OAuth Apps](https://www.google.com/search?q=https://github.com/settings/connections/applications&utm_source=gemini))에서 Organization 권한(`Grant`) 부여 여부 확인


2. **`redirect_uri_mismatch` 오류 발생 시**
* GitHub OAuth App의 Authorization callback URL이 `[https://black-sun-634d.garcia47stand.workers.dev/callback](https://black-sun-634d.garcia47stand.workers.dev/callback)`으로 주소 뒤 `/callback`까지 들어갔는지 점검
