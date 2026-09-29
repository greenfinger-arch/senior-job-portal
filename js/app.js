const GITHUB_REPO = "greenfinger-arch/senior-job-portal";
const GITHUB_BRANCH = "main";

// 한글 카테고리명과 HTML data-category 키값 매핑
const CATEGORY_MAP = {
  "시니어 재취업": "jobs",
  "중장년 부업/N잡": "side-hustle",
  "교육/자격증": "education",
  "정부 지원금": "welfare"
};

// 키값으로 한글 카테고리명을 찾는 역매핑
const REVERSE_CATEGORY_MAP = {
  "jobs": "시니어 재취업",
  "side-hustle": "중장년 부업/N잡",
  "education": "교육/자격증",
  "welfare": "정부 지원금"
};

document.addEventListener("DOMContentLoaded", async () => {
  // 1. 모바일 메뉴 토글
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
  }

  // 2. 글로벌 링크 클릭 예외 처리
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    if (
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.endsWith('.html') ||
      href === '/' ||
      href.startsWith('#')
    ) {
      return;
    }
  });

  const grid = document.getElementById('articleGrid');
  const pillarArea = document.getElementById('pillarArea');

  // 카테고리 및 메인 목록 페이지 영역이 없으면 중단 (article.html 등에서는 실행 방지)
  if (!grid) return;

  const currentCategoryKey = grid.dataset.category; // 예: "jobs", "side-hustle", "all"
  const targetKoreanCategory = REVERSE_CATEGORY_MAP[currentCategoryKey] || null;

  try {
    const listUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`;
    const res = await fetch(listUrl);
    
    if (!res.ok) throw new Error("포스트 목록을 불러올 수 없습니다.");
    const files = await res.json();

    const mdFiles = files.filter(file => file.name.endsWith('.md'));

    if (mdFiles.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666; padding: 40px 0; text-align: center;">등록된 기사가 없습니다.</p>';
      if (pillarArea) pillarArea.innerHTML = '';
      return;
    }

    const now = new Date();

    const articlePromises = mdFiles.map(async (file) => {
      const rawRes = await fetch(file.download_url);
      const text = await rawRes.text();
      const parts = text.split(/^---$/m);

      let metadata = {};
      if (parts.length >= 3) {
        metadata = jsyaml.load(parts[1]) || {};
      }

      let slug = metadata.slug;
      if (!slug) {
        slug = file.name.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
      }

      const categoryName = metadata.category || '기타';
      const catKey = metadata.categoryKey || CATEGORY_MAP[categoryName] || '';

      return {
        slug: String(slug).trim(),
        title: metadata.title || slug,
        category: categoryName,
        categoryKey: catKey,
        date: metadata.date ? String(metadata.date).substring(0, 10) : '',
        rawDate: metadata.date ? new Date(metadata.date) : new Date(0),
        summary: metadata.excerpt || metadata.summary || metadata.description || '',
        thumbnail: metadata.thumbnail || 'https://picsum.photos/600/380',
        isPillar: metadata.is_pillar === true
      };
    });

    const articles = await Promise.all(articlePromises);

    // 예약 발행 필터링 (현재 시간 이하인 게시글만 공개)
    const publishedArticles = articles.filter(item => item.rawDate <= now);

    // 최신순 정렬
    publishedArticles.sort((a, b) => b.rawDate - a.rawDate);

    // 카테고리 필터링 (키값 비교 및 한글 카테고리명 비교 모두 지원)
    const filteredArticles = (currentCategoryKey && currentCategoryKey !== 'all')
      ? publishedArticles.filter(item => 
          item.categoryKey === currentCategoryKey || 
          item.category === targetKoreanCategory ||
          item.category === currentCategoryKey
        )
      : publishedArticles;

    if (filteredArticles.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666; padding: 40px 0; text-align: center;">등록된 기사가 곧 업데이트될 예정입니다.</p>';
      if (pillarArea) pillarArea.innerHTML = '';
      return;
    }

    // 대표 기둥 기사(Pillar)와 일반 기사 분리
    const pillarArticle = filteredArticles.find(item => item.isPillar === true);
    const regularArticles = filteredArticles.filter(item => item !== pillarArticle);

    // 기둥 기사 렌더링
    if (pillarArticle && pillarArea) {
      pillarArea.innerHTML = `
        <article class="info-card pillar-card" style="margin-bottom: 30px; border: 2px solid #2b6cb0; background: #f8fafc;">
          <div class="card-image">
            <span class="badge badge-blue" style="background-color: #2b6cb0;">📌 필독 대표 가이드</span>
            <img src="${pillarArticle.thumbnail}" alt="${pillarArticle.title}" loading="lazy">
          </div>
          <div class="card-body">
            <h2 class="card-title" style="font-size: 1.4rem; font-weight: bold;">
              <a href="/${pillarArticle.slug}">${pillarArticle.title}</a>
            </h2>
            <p class="card-text">${pillarArticle.summary}</p>
            <div class="card-meta">
              <span>${pillarArticle.date}</span>
              <a href="/${pillarArticle.slug}" class="read-more" style="font-weight: bold;">전체 가이드 읽기 &rarr;</a>
            </div>
          </div>
        </article>
      `;
    } else if (pillarArea) {
      pillarArea.innerHTML = '';
    }

    // 일반 카드 목록 렌더링
    grid.innerHTML = regularArticles.map(article => `
      <article class="info-card">
        <div class="card-image">
          <span class="badge badge-blue">${article.category}</span>
          <img src="${article.thumbnail}" alt="${article.title}" loading="lazy">
        </div>
        <div class="card-body">
          <h3 class="card-title">
            <a href="/${article.slug}">${article.title}</a>
          </h3>
          <p class="card-text">${article.summary}</p>
          <div class="card-meta">
            <span>${article.date}</span>
            <a href="/${article.slug}" class="read-more">자세히 보기 &rarr;</a>
          </div>
        </div>
      </article>
    `).join('');

  } catch (err) {
    console.error("CMS 데이터 로딩 실패:", err);
    grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666; padding: 40px 0; text-align: center;">기사를 불러오는 중 오류가 발생했습니다.</p>';
  }
});