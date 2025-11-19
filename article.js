// Đường dẫn tới file JSON chính
const JSON_FILE_PATH = "news/results_with_id.json";

/**
 * Lấy ID từ URL parameter
 */
function getArticleIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

/**
 * Format nội dung theo quy tắc:
 * - 2 lần \n\n = cách đoạn nhỏ
 * - 4 lần \n\n = cách đoạn lớn
 */
function formatContent(content) {
  if (!content) return "";

  // Thay thế 4 lần \n\n (tức 8 ký tự \n) bằng marker đặc biệt
  let formatted = content.replace(/\n\n\n\n/g, "|||LARGE_BREAK|||");

  // Thay thế 2 lần \n\n (tức 4 ký tự \n) bằng marker nhỏ
  formatted = formatted.replace(/\n\n/g, "|||SMALL_BREAK|||");

  // Tách thành các đoạn
  const parts = formatted.split("|||LARGE_BREAK|||");

  return parts
    .map((section) => {
      // Mỗi section có thể có nhiều đoạn nhỏ
      const paragraphs = section
        .split("|||SMALL_BREAK|||")
        .filter((p) => p.trim())
        .map((p) => `<p class="article-paragraph">${p.trim()}</p>`)
        .join("");

      return `<div class="article-section">${paragraphs}</div>`;
    })
    .join("");
}

/**
 * Load và hiển thị bài viết
 */
async function loadArticle() {
  const articleId = getArticleIdFromUrl();
  const contentDiv = document.getElementById("article-content");

  if (!articleId) {
    contentDiv.innerHTML = `
      <div class="error">
        Không tìm thấy ID bài viết.<br>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(JSON_FILE_PATH);
    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu bài viết");
    }

    const articles = await response.json();

    // QUAN TRỌNG: So sánh cả string và number
    // ID từ URL là string, nhưng ID trong JSON có thể là number hoặc string
    const article = articles.find((a) => {
      // Chuyển cả 2 về string để so sánh
      return String(a.id) === String(articleId);
    });

    // Debug: In ra console để kiểm tra
    console.log("Article ID from URL:", articleId, "Type:", typeof articleId);
    console.log(
      "Available articles:",
      articles.map((a) => ({ id: a.id, type: typeof a.id }))
    );
    console.log("Found article:", article);

    if (!article) {
      contentDiv.innerHTML = `
        <div class="error">
          Không tìm thấy bài viết với ID: ${articleId}<br>
          <small>Kiểm tra console để xem thông tin debug</small><br>
          
        </div>
      `;
      return;
    }

    // Hiển thị bài viết
    displayArticle(article);
  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error">
        Lỗi: ${error.message}<br>
        Vui lòng kiểm tra đường dẫn file JSON.<br>
        
      </div>
    `;
    console.error("Error loading article:", error);
  }
}

/**
 * Hiển thị nội dung bài viết
 */
function displayArticle(article) {
  const contentDiv = document.getElementById("article-content");

  // Tạo HTML cho bài viết
  const articleHTML = `
    <div class="article-header">
      <h1 class="article-detail-title">${
        article.title || "Không có tiêu đề"
      }</h1>
      
      <div class="article-author">
        <em>ThS Lê Quốc Thịnh</em> - Nguyên Trưởng khoa Dược, Bệnh viện 71 TW
      </div>
    </div>

    <div class="article-body">
      ${formatContent(article.content)}
    </div>

  `;

  contentDiv.innerHTML = articleHTML;

  // Cập nhật title trang
  document.title = `${article.title || "Bài viết"} - LQT`;
}

// Load bài viết khi trang được tải
window.addEventListener("DOMContentLoaded", loadArticle);
