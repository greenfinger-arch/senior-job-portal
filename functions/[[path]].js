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

  // 3. 메인, 카테고리 HTML, 관리자, 정적 자원은 그대로 통과
  if (
    pathname === '/' ||
    hasExtension ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/js')
  ) {
    return env.ASSETS.fetch(request);
  }

  // 4. 클린 URL(/national-learning-card-guide 등) 요청 시 article.html 내용을 응답
  const articleUrl = new URL('/article.html', url.origin);
  return env.ASSETS.fetch(articleUrl.toString());
}