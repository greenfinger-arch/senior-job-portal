export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 1. Root(/), 메인 HTML 파일들, 관리자(/admin), 이미지, 확장자가 명확한 정적 자원 예외 처리
  const isStaticFile = /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|json|yml|yaml|txt|xml|html)$/i.test(pathname);

  if (
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/js') ||
    isStaticFile
  ) {
    return context.next();
  }

  // 2. 확장자가 없는 게시글 클린 URL 경로(/national-support-card-guide 등)를 article.html로 포워딩
  const articleUrl = new URL('/article.html', url.origin);
  return context.env.ASSETS.fetch(articleUrl);
}