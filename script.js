// Đường dẫn tới file JSON
const JSON_FILE = "news/khoahocdoisong_articles.json";
const ITEMS_PER_PAGE = 6;
let allArticles = [];
let currentPage = 1;
let totalPages = 1;

/**
 * Hàm đọc và hiển thị dữ liệu từ file JSON.
 */
async function loadArticles() {
  try {
    const response = await fetch(JSON_FILE);
    if (!response.ok) {
      throw new Error("Không thể tải file JSON");
    }
    allArticles = await response.json();
    totalPages = Math.ceil(allArticles.length / ITEMS_PER_PAGE);
    displayPage(1);
  } catch (error) {
    document.getElementById("content").innerHTML = `
      <div class="error">
        Lỗi: ${error.message}<br>
        Vui lòng kiểm tra file khoahocdoisong_articles.json có tồn tại không.
      </div>
    `;
  }
}

/**
 * Hàm hiển thị một trang cụ thể.
 * @param {number} pageNum - Số trang cần hiển thị (bắt đầu từ 1).
 */
function displayPage(pageNum) {
  currentPage = pageNum;
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = "";

  // Tạo grid cho trang hiện tại
  const gridDiv = document.createElement("div");
  gridDiv.className = "grid";

  // Lấy 6 bài viết cho trang này
  const startIdx = (pageNum - 1) * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, allArticles.length);
  const pageArticles = allArticles.slice(startIdx, endIdx);

  // Tạo card cho mỗi bài viết
  pageArticles.forEach((article) => {
    const card = createArticleCard(article);
    gridDiv.appendChild(card);
  });

  contentDiv.appendChild(gridDiv);

  // Thêm phân trang
  const paginationDiv = createPagination();
  contentDiv.appendChild(paginationDiv);

  // Cuộn lên đầu trang
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Hàm tạo thanh phân trang với các nút số.
 * @returns {HTMLElement} - Phần tử div chứa các nút phân trang.
 */
function createPagination() {
  const paginationDiv = document.createElement("div");
  paginationDiv.className = "pagination";

  // Nút Previous
  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.className = "page-btn";
    prevBtn.textContent = "‹ Trước";
    prevBtn.onclick = () => displayPage(currentPage - 1);
    paginationDiv.appendChild(prevBtn);
  }

  // Hiển thị các số trang
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Điều chỉnh startPage nếu endPage đã đạt tối đa
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Nút trang đầu và dấu ...
  if (startPage > 1) {
    const firstBtn = document.createElement("button");
    firstBtn.className = "page-btn";
    firstBtn.textContent = "1";
    firstBtn.onclick = () => displayPage(1);
    paginationDiv.appendChild(firstBtn);

    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.className = "page-dots";
      dots.textContent = "...";
      paginationDiv.appendChild(dots);
    }
  }

  // Các nút số trang
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = "page-btn" + (i === currentPage ? " active" : "");
    pageBtn.textContent = i;
    pageBtn.onclick = () => displayPage(i);
    paginationDiv.appendChild(pageBtn);
  }

  // Dấu ... và nút trang cuối
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.className = "page-dots";
      dots.textContent = "...";
      paginationDiv.appendChild(dots);
    }
    const lastBtn = document.createElement("button");
    lastBtn.className = "page-btn";
    lastBtn.textContent = totalPages;
    lastBtn.onclick = () => displayPage(totalPages);
    paginationDiv.appendChild(lastBtn);
  }

  // Nút Next
  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.className = "page-btn";
    nextBtn.textContent = "Sau ›";
    nextBtn.onclick = () => displayPage(currentPage + 1);
    paginationDiv.appendChild(nextBtn);
  }

  return paginationDiv;
}

/**
 * Hàm tạo card HTML cho một bài viết.
 * @param {Object} article - Đối tượng bài viết.
 * @returns {HTMLElement} - Phần tử div (card) của bài viết.
 */
function createArticleCard(article) {
  const card = document.createElement("div");
  card.className = "article-card";

  // Chuyển hướng đến trang chi tiết thay vì mở URL gốc
  card.onclick = () => {
    window.location.href = `article.html?id=${article.id}`;
  };

  const extensions = ["jpg", "webp", "png", "gif"];
  const basePath = `img/${article.id}`;
  let currentIndex = 0;

  // Tạo thẻ img
  const img = document.createElement("img");
  img.alt = article.tieu_de;
  img.className = "article-image";

  // Hàm thử load lần lượt từng đuôi
  function tryNextImage() {
    if (currentIndex >= extensions.length) {
      // Hết các đuôi => dùng placeholder SVG
      img.src =
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22Arial%22%3EKhông có ảnh%3C/text%3E%3C/svg%3E";
      img.onerror = null;
      return;
    }
    const ext = extensions[currentIndex];
    img.src = `${basePath}.${ext}`;
    currentIndex++;
  }

  img.onerror = tryNextImage;
  tryNextImage();

  // Tạo phần nội dung text
  const titleDiv = document.createElement("div");
  titleDiv.className = "article-title";
  titleDiv.textContent = article.tieu_de;

  const descDiv = document.createElement("div");
  descDiv.className = "article-description";
  descDiv.textContent = article.mo_ta;

  // Gắn vào card
  card.appendChild(img);
  card.appendChild(titleDiv);
  card.appendChild(descDiv);

  return card;
}

// Tải dữ liệu khi trang web được load
window.addEventListener("DOMContentLoaded", loadArticles);
