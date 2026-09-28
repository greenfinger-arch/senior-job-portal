export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 1. 관리자 페이지(/admin), Decap CMS 관련 경로, 정적 자원, 시스템 경로 예외 처리
  if (
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') // 확장자가 있는 파일들 (.html, .css, .js, .png, .json, .yml 등)
  ) {
    return context.next();
  }

  // 2. 확장자가 없는 일반 글 슬러그 경로(/national-support-card-guide 등)만 article.html로 포워딩
  const articleUrl = new URL('/article.html', url.origin);
  return context.env.ASSETS.fetch(articleUrl);
}