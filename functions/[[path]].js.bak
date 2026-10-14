export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. GET/HEAD 외 요청은 그대로 전달
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return env.ASSETS.fetch(request);
  }

  // 2. 확장자가 있는 정적 파일(.html, .css, .js, .png 등)은 파일 그대로 읽기
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(pathname);

  // 3. 카테고리 경로 목록 (확장자가 있든 없든 명시적으로 허용)
  const categoryPaths = [
    '/jobs', '/jobs.html',
    '/side-hustle', '/side-hustle.html',
    '/education', '/education.html',
    '/welfare', '/welfare.html',
    '/senior-startup', '/senior-startup.html'
  ];

  // 4. 메인, 카테고리, 관리자, 정적 자원은 그대로 통과
  if (
    pathname === '/' ||
    hasExtension ||
    categoryPaths.includes(pathname) ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/js')
  ) {
    return env.ASSETS.fetch(request);
  }

  // 5. 그 외의 클린 URL 요청 시 article.html 내용을 응답
  const articleUrl = new URL('/article.html', url.origin);
  return env.ASSETS.fetch(articleUrl.toString());
}