document.addEventListener("DOMContentLoaded", function () {
  // 1. 모바일 메뉴 토글 로직
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function () {
      mainNav.classList.toggle("open");
    });
  }

  // 2. 동적 기사 로딩 및 카테고리 필터링 (articleGrid 요소가 있을 경우 실행)
  const grid = document.getElementById("articleGrid");
  if (!grid) return;

  const currentCategory = grid.dataset.category; // 예: "education", "jobs", "side-hustle", "welfare"

  // GitHub 레포지토리 또는 로컬 JSON/YAML 경로에서 데이터 로드
  const GITHUB_REPO = "greenfinger-arch/senior-job-portal";
  const GITHUB_BRANCH = "main";
  const dataUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/posts/index.json`;

  fetch(dataUrl)
    .then((response) => {
      if (!response.ok) throw new Error("네트워크 응답 오류");
      return response.json();
    })
    .then((articles) => {
      // 카테고리별 필터링 (전체보기 페이지는 필터 없이 전체 표시)
      const filteredArticles = currentCategory && currentCategory !== "all"
        ? articles.filter((item) => item.category === currentCategory)
        : articles;

      if (!filteredArticles || filteredArticles.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666; padding: 40px 0; text-align: center;">등록된 기사가 곧 업데이트될 예정입니다.</p>';
        return;
      }

      // 카드 생성 및 주입
      grid.innerHTML = filteredArticles
        .map((article) => {
          // 마크다운 기사(article.html?slug=...) 또는 기존 HTML 파일 연동
          const articleUrl = article.slug ? `article.html?slug=${article.slug}` : (article.url || '#');
          const badgeClass = article.category === 'education' ? 'badge-blue' : 
                            article.category === 'side-hustle' ? 'badge-green' : 'badge-orange';

          return `
            <article class="info-card">
              <div class="card-image">
                <span class="badge ${badgeClass}">${article.categoryName || '교육/자격증'}</span>
                <img src="${article.thumbnail || 'https://picsum.photos/600/380'}" alt="${article.title}" loading="lazy">
              </div>
              <div class="card-body">
                <h3 class="card-title">
                  <a href="${articleUrl}">${article.title}</a>
                </h3>
                <p class="card-text">${article.summary || article.excerpt || ''}</p>
                <div class="card-meta">
                  <span>${article.date || ''}</span>
                  <a href="${articleUrl}" class="read-more">자세히 보기 &rarr;</a>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
    })
    .catch((err) => {
      console.warn("동적 기사 데이터 로딩 중 오류 발생 (기존 HTML 정적 유지):", err);
    });
});