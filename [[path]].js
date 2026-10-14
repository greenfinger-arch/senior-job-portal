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

  // 📌 3. 메인, 카테고리 경로(클린 URL 포함), 관리자, 정적 자원은 그대로 통과시키도록 추가
  const categories = ['/jobs', '/side-hustle', '/education', '/welfare', '/senior-startup'];
  if (
    pathname === '/' ||
    hasExtension ||
    categories.includes(pathname) ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/js')
  ) {
    return env.ASSETS.fetch(request);
  }

  // 4. 진짜 기사 슬러그 요청 시 article.html 내용을 응답
  const articleUrl = new URL('/article.html', url.origin);
  return env.ASSETS.fetch(articleUrl.toString());
}