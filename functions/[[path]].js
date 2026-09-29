export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. GET 또는 HEAD 요청이 아닌 경우 정적 자원으로 바로 넘김
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return env.ASSETS.fetch(request);
  }

  // 2. 메인 페이지(/), 시스템 경로, 정적 자원 확장자 예외 처리
  const isStaticFile = /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|json|yml|yaml|txt|xml|html)$/i.test(pathname);

  if (
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/js') ||
    isStaticFile
  ) {
    return env.ASSETS.fetch(request);
  }

  // 3. 클린 URL 경로(예: /national-support-card-guide)를 article.html로 내부 포워딩
  const articleUrl = new URL('/article.html', url.origin);

  // 원본 Request의 Header 및 속성을 유지하여 article.html 호출
  return env.ASSETS.fetch(new Request(articleUrl.toString(), request));
}