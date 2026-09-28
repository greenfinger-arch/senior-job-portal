export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 1. 루트 메인 페이지 및 정적 파일/HTML 페이지는 그대로 렌더링
  if (
    pathname === '/' ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/admin')
  ) {
    return context.next();
  }

  // 2. 그 외 영문 슬러그 경로(/national-support-card-guide 등)는 article.html로 포워딩
  const articleUrl = new URL('/article.html', url.origin);
  return context.env.ASSETS.fetch(articleUrl);
}