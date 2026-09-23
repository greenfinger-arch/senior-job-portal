// GitHub 저장소 정보
const GITHUB_REPO = "greenfinger-arch/senior-job-portal";
const GITHUB_BRANCH = "main"; // 또는 master

// 메인 실행 함수
document.addEventListener("DOMContentLoaded", async () => {
  const cardGrid = document.querySelector(".card-grid");
  if (!cardGrid) return;

  // 현재 페이지의 카테고리 확인 (body 태그의 data-category 속성 또는 파일명 기준)
  const currentCategory = document.body.dataset.category || "all";

  try {
    // 1. GitHub API로 posts 폴더 내 파일 목록 조회
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`);
    if (!response.ok) {
      console.log("작성된 기사가 아직 없거나 posts 폴더를 찾을 수 없습니다.");
      return;
    }

    const files = await response.json();
    const posts = [];

    // 2. 각 마크다운 파일 내용 읽어오기
    for (const file of files) {
      if (file.name.endsWith(".md")) {
        const fileRes = await fetch(file.download_url);
        const text = await fileRes.text();
        const post = parseMarkdown(text, file.name);
        if (post) posts.push(post);
      }
    }

    // 3. 최신 발행일 순으로 정렬
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 4. 카테고리 필터링 (전체보기가 아닌 경우)
    const filteredPosts = currentCategory === "all" 
      ? posts 
      : posts.filter(post => post.category === currentCategory);

    // 5. 기사 카드가 존재하면 그리드 화면 갱신
    if (filteredPosts.length > 0) {
      cardGrid.innerHTML = filteredPosts.map(renderCardHTML).join("");
    }
  } catch (error) {
    console.error("기사 목록을 불러오는 중 오류 발생:", error);
  }
});

// Frontmatter YAML과 Markdown 파싱 함수
function parseMarkdown(text, filename) {
  try {
    const parts = text.split("---");
    if (parts.length < 3) return null;
    
    const frontmatter = jsyaml.load(parts[1]);
    const body = parts.slice(2).join("---").trim();

    return {
      title: frontmatter.title || "제목 없음",
      category: frontmatter.category || "기타",
      date: frontmatter.date ? frontmatter.date.substring(0, 10) : "",
      thumbnail: frontmatter.thumbnail || "https://picsum.photos/600/380?random=1",
      excerpt: frontmatter.excerpt || body.substring(0, 80) + "...",
      slug: filename.replace(".md", "")
    };
  } catch (e) {
    return null;
  }
}

// 카테고리별 배지 색상 지정 함수
function getBadgeClass(category) {
  switch (category) {
    case "시니어 재취업": return "badge-blue";
    case "중장년 부업/N잡": return "badge-green";
    case "교육/자격증": return "badge-orange";
    case "정부 지원금": return "badge-purple";
    default: return "badge-blue";
  }
}

// HTML 카드 템플릿 생성 함수
function renderCardHTML(post) {
  const badgeClass = getBadgeClass(post.category);
  
  return `
    <article class="info-card">
      <div class="card-image">
        <span class="badge ${badgeClass}">${post.category}</span>
        <img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
      </div>
      <div class="card-body">
        <h3 class="card-title">
          <a href="article.html?slug=${post.slug}">${post.title}</a>
        </h3>
        <p class="card-text">${post.excerpt}</p>
        <div class="card-meta">
          <span>${post.date}</span>
          <a href="article.html?slug=${post.slug}" class="read-more" style="text-decoration:none;">자세히 보기 &rarr;</a>
        </div>
      </div>
    </article>
  `;
}