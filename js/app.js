const GITHUB_REPO = "greenfinger-arch/senior-job-portal";
const GITHUB_BRANCH = "main";

document.addEventListener("DOMContentLoaded", async () => {
  const cardGrid = document.querySelector(".card-grid");
  if (!cardGrid) return;

  const currentCategory = document.body.dataset.category || "all";

  try {
    // GitHub Raw Content CDN을 통한 안전한 파일 목록 및 내용 조회
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.warn("posts 폴더를 읽을 수 없거나 아직 기사가 없습니다. 상태코드:", response.status);
      return;
    }

    const files = await response.json();
    if (!Array.isArray(files)) return;

    const posts = [];

    for (const file of files) {
      if (file.name.endsWith(".md")) {
        // raw.githubusercontent.com 주소를 직접 이용하여 CORS 및 보안 차단 회피
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/posts/${file.name}`;
        const fileRes = await fetch(rawUrl);
        
        if (fileRes.ok) {
          const text = await fileRes.text();
          const post = parseMarkdown(text, file.name);
          if (post) posts.push(post);
        }
      }
    }

    // 최신 날짜순 정렬
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 카테고리 필터링
    const filteredPosts = currentCategory === "all" 
      ? posts 
      : posts.filter(post => post.category === currentCategory);

    if (filteredPosts.length > 0) {
      cardGrid.innerHTML = filteredPosts.map(renderCardHTML).join("");
    } else {
      console.log("표시할 기사 데이터가 없습니다.");
    }
  } catch (error) {
    console.error("기사 데이터 로딩 에러:", error);
  }
});

// 유연하게 개선된 마크다운 파싱 함수
function parseMarkdown(text, filename) {
  try {
    // --- 구분자로 split
    const parts = text.split(/^---$/m);
    
    if (parts.length < 3) {
      // 대안 파싱 (줄바꿈 문자가 \r\n 인 경우 대응)
      const altParts = text.split("---");
      if (altParts.length < 3) return null;
      return buildPostObject(jsyaml.load(altParts[1]), altParts.slice(2).join("---"), filename);
    }

    const frontmatter = jsyaml.load(parts[1]);
    const body = parts.slice(2).join("---").trim();
    return buildPostObject(frontmatter, body, filename);
  } catch (e) {
    console.error("마크다운 파싱 실패:", filename, e);
    return null;
  }
}

function buildPostObject(frontmatter, body, filename) {
  if (!frontmatter) return null;
  return {
    title: frontmatter.title || "제목 없음",
    category: frontmatter.category || "기타",
    date: frontmatter.date ? String(frontmatter.date).substring(0, 10) : "",
    thumbnail: frontmatter.thumbnail || "https://picsum.photos/600/380?random=1",
    excerpt: frontmatter.excerpt || body.replace(/[#*`>-]/g, "").substring(0, 80) + "...",
    slug: filename.replace(".md", "")
  };
}

function getBadgeClass(category) {
  switch (category) {
    case "시니어 재취업": return "badge-blue";
    case "중장년 부업/N잡": return "badge-green";
    case "교육/자격증": return "badge-orange";
    case "정부 지원금": return "badge-purple";
    default: return "badge-blue";
  }
}

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