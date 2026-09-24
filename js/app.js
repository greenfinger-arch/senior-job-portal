const GITHUB_REPO = "greenfinger-arch/senior-job-portal";
const GITHUB_BRANCH = "main";

// 한글 카테고리를 HTML data-category 키값과 매칭하는 맵
const CATEGORY_MAP = {
  "시니어 재취업": "jobs",
  "중장년 부업/N잡": "side-hustle",
  "교육/자격증": "education",
  "정부 지원금": "welfare"
};

document.addEventListener("DOMContentLoaded", async () => {
  // 모바일 메뉴 토글
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
  }

  const grid = document.getElementById('articleGrid');
  const pillarArea = document.getElementById('pillarArea'); // 📌 기둥 기사 영역
  if (!grid) return;

  const currentCategory = grid.dataset.category; // 예: "jobs", "side-hustle", "education", "welfare", "all"

  try {
    // 1. GitHub API를 통해 posts 폴더의 모든 마크다운 파일 목록 가져오기
    const listUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`;
    const res = await fetch(listUrl);
    
    if (!res.ok) throw new Error("포스트 목록을 불러올 수 없습니다.");
    const files = await res.json();

    // .md 파일만 필터링
    const mdFiles = files.filter(file => file.name.endsWith('.md'));

    if (mdFiles.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666; padding: 40px 0; text-align: center;">등록된 기사가 없습니다.</p>';
      return;
    }

    // 2. 각 마크다운 파일의 Frontmatter(YAML Header) 읽어오기
    const articlePromises = mdFiles.map(async (file) => {
      const rawRes = await fetch(file.download_url);
      const text = await rawRes.text();
      const parts = text.split(/^---$/m);

      let metadata = {};
      if (parts.length >= 3) {
        metadata = jsyaml.load(parts[1]);
      }

      const slug = file.name.replace('.md', '');
      const categoryName = metadata.category || '기타';
      
      return {
        slug: slug,
        title: metadata.title || slug,
        category: categoryName,
        categoryKey: metadata.categoryKey || CATEGORY_MAP[categoryName] || '',
        date: metadata.date ? String(metadata.date).substring(0, 10) : '',
        summary: metadata.excerpt || metadata.summary || metadata.description || '',
        thumbnail: metadata.thumbnail || 'https://picsum.photos/600/380',
        isPillar: metadata.is_pillar === true // 📌 config.yml의 is_pillar 값 읽기
      };
    });

    const articles = await Promise.all(articlePromises);

    // 날짜 기준 내림차순 정렬 (최신 글이 위로)
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. 현재 페이지의 카테고리와 일치하는 기사만 필터링 (all이면 전체)
    const filteredArticles = (currentCategory && currentCategory !== 'all')
      ? articles.filter(item => item.categoryKey === currentCategory || item.category === currentCategory)
      : articles;

    if (filteredArticles.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666; padding: 40px 0; text-align: center;">등록된 기사가 곧 업데이트될 예정입니다.</p>';
      if (pillarArea) pillarArea.innerHTML = '';
      return;
    }

    // 4. 📌 기둥 기사(isPillar: true)와 일반 기사 분리
    const pillarArticle = filteredArticles.find(item => item.isPillar === true);
    const regularArticles = filteredArticles.filter(item => item !== pillarArticle);

    // 5. 📌 기둥 기사 상단 렌더링 (is_pillar 기사가 있고, pillarArea 요소가 존재할 경우)
    if (pillarArticle && pillarArea) {
      pillarArea.innerHTML = `
        <article class="info-card pillar-card" style="margin-bottom: 30px; border: 2px solid #2b6cb0; background: #f8fafc;">
          <div class="card-image">
            <span class="badge badge-blue" style="background-color: #2b6cb0;">📌 필독 대표 가이드</span>
            <img src="${pillarArticle.thumbnail}" alt="${pillarArticle.title}" loading="lazy">
          </div>
          <div class="card-body">
            <h2 class="card-title" style="font-size: 1.4rem; font-weight: bold;">
              <a href="article.html?slug=${pillarArticle.slug}">${pillarArticle.title}</a>
            </h2>
            <p class="card-text">${pillarArticle.summary}</p>
            <div class="card-meta">
              <span>${pillarArticle.date}</span>
              <a href="article.html?slug=${pillarArticle.slug}" class="read-more" style="font-weight: bold;">전체 가이드 읽기 &rarr;</a>
            </div>
          </div>
        </article>
      `;
    } else if (pillarArea) {
      pillarArea.innerHTML = ''; // 기둥 기사가 없으면 영역 비움
    }

    // 6. 하단 일반 카드 목록 렌더링
    grid.innerHTML = regularArticles.map(article => `
      <article class="info-card">
        <div class="card-image">
          <span class="badge badge-blue">${article.category}</span>
          <img src="${article.thumbnail}" alt="${article.title}" loading="lazy">
        </div>
        <div class="card-body">
          <h3 class="card-title">
            <a href="article.html?slug=${article.slug}">${article.title}</a>
          </h3>
          <p class="card-text">${article.summary}</p>
          <div class="card-meta">
            <span>${article.date}</span>
            <a href="article.html?slug=${article.slug}" class="read-more">자세히 보기 &rarr;</a>
          </div>
        </div>
      </article>
    `).join('');

  } catch (err) {
    console.error("CMS 데이터 로딩 실패:", err);
    grid.innerHTML = '<p style="grid-column: 1 / -1; color: #666; padding: 40px 0; text-align: center;">기사를 불러오는 중 오류가 발생했습니다.</p>';
  }
});