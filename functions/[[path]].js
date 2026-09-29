export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. GET 및 HEAD 요청 외에는 정적 파일 처리로 넘김
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return env.ASSETS.fetch(request);
  }

  // 2. 확장자 검사용 정규식
  const isStaticFile = /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|json|yml|yaml|txt|xml|html)$/i.test(pathname);

  // 3. 메인 페이지(/), 타겟 페이지(/article.html), 정적 자원 무한 루프 방지 예외 처리
  if (
    pathname === '/' ||
    pathname === '/article.html' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/js') ||
    isStaticFile
  ) {
    return env.ASSETS.fetch(request);
  }

  // 4. 게시글 클린 URL 요청을 article.html로 포워딩 (request 객체를 엮지 않고 URL 문자열로만 요청)
  const articleUrl = new URL('/article.html', url.origin);
  
  return env.ASSETS.fetch(articleUrl.toString());
}