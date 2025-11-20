// Lấy ID từ URL
function getArticleIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get("id"));
}

// Load dữ liệu từ file JSON và hiển thị bài viết
async function loadArticle() {
  const articleId = getArticleIdFromURL();
  const loadingMessage = document.getElementById("loadingMessage");
  const articleContainer = document.getElementById("articleContainer");

  try {
    // Load dữ liệu từ file JSON
    const response = await fetch("news/B2-FBker-văn thơ toàn tập.json");

    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu");
    }

    const data = await response.json();

    // Xử lý nếu data là array hoặc single object
    const blogData = Array.isArray(data) ? data : [data];

    // Tìm bài viết theo ID
    const article = blogData.find((item) => item.id === articleId);

    if (article) {
      // Ẩn loading, hiện nội dung
      loadingMessage.style.display = "none";
      articleContainer.style.display = "block";

      // Hiển thị tiêu đề
      document.getElementById("articleTitle").textContent = article.tieu_de;

      // Xử lý nội dung: thay \n thành \n\n
      const processedContent = article.content.replace(/\n/g, "\n\n");
      document.getElementById("articleContent").textContent = processedContent;

      // Cập nhật title của trang
      document.title = article.tieu_de + " - Tạp chí hiện đại";
    } else {
      // Không tìm thấy bài viết
      loadingMessage.style.display = "none";
      articleContainer.style.display = "block";
      document.getElementById("articleTitle").textContent =
        "Không tìm thấy bài viết";
      document.getElementById("articleContent").textContent =
        "Bài viết không tồn tại hoặc đã bị xóa.";
    }
  } catch (error) {
    console.error("Lỗi khi load bài viết:", error);
    loadingMessage.textContent =
      "Có lỗi xảy ra khi tải bài viết. Vui lòng thử lại sau.";
  }
}

// Initialize - Tự động chạy khi trang được load
document.addEventListener("DOMContentLoaded", loadArticle);
