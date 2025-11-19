// Đường dẫn tới file JSON chứa videos
const VIDEO_JSON_FILE = "youtube-embed-generator/videos.json";
const VIDEOS_PER_PAGE = 5;
let allVideos = [];
let currentPage = 1;
let totalPages = 1;

/**
 * Format ngày tháng từ ISO string
 */
function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Tạo card cho một video
 */
function createVideoCard(video) {
  const card = document.createElement("div");
  card.className = "video-card";

  // Tạo responsive iframe wrapper
  const iframeWrapper = document.createElement("div");
  iframeWrapper.className = "video-iframe-wrapper";

  // Tạo iframe từ embed code hoặc từ videoId
  let iframe;
  if (video.embed) {
    // Sử dụng embed code có sẵn
    iframeWrapper.innerHTML = video.embed;
    iframe = iframeWrapper.querySelector("iframe");
  } else if (video.videoId) {
    // Tạo iframe từ videoId
    iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${video.videoId}`;
    iframe.title = video.title;
    iframe.frameBorder = "0";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframeWrapper.appendChild(iframe);
  }

  // Đảm bảo iframe có class responsive
  if (iframe) {
    iframe.className = "video-iframe";
  }

  // Tạo phần title
  const titleDiv = document.createElement("div");
  titleDiv.className = "video-title";
  titleDiv.textContent = video.title
    ? video.title.toUpperCase()
    : "UNTITLED VIDEO";

  // Tạo phần thông tin bổ sung (ngày đăng)
  if (video.publishTime) {
    const infoDiv = document.createElement("div");
    infoDiv.className = "video-info";
    // infoDiv.textContent = `Đăng ngày: ${formatDate(video.publishTime)}`;

    card.appendChild(iframeWrapper);
    card.appendChild(titleDiv);
    card.appendChild(infoDiv);
  } else {
    card.appendChild(iframeWrapper);
    card.appendChild(titleDiv);
  }

  return card;
}

/**
 * Tạo thanh phân trang
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
 * Hiển thị một trang cụ thể
 */
function displayPage(pageNum) {
  currentPage = pageNum;
  const contentDiv = document.getElementById("video-content");
  contentDiv.innerHTML = "";

  // Lấy videos cho trang hiện tại
  const startIdx = (pageNum - 1) * VIDEOS_PER_PAGE;
  const endIdx = Math.min(startIdx + VIDEOS_PER_PAGE, allVideos.length);
  const pageVideos = allVideos.slice(startIdx, endIdx);

  if (pageVideos.length === 0) {
    contentDiv.innerHTML = `
      <div class="error">
        Không có video nào để hiển thị.
      </div>
    `;
    return;
  }

  // Tạo grid container
  const gridDiv = document.createElement("div");
  gridDiv.className = "video-grid";

  // Tạo card cho mỗi video
  pageVideos.forEach((video) => {
    const card = createVideoCard(video);
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
 * Load videos từ file JSON
 */
async function loadVideos() {
  const contentDiv = document.getElementById("video-content");

  try {
    const response = await fetch(VIDEO_JSON_FILE);
    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu videos");
    }

    allVideos = await response.json();

    // Kiểm tra nếu JSON là array hay object đơn
    if (!Array.isArray(allVideos)) {
      allVideos = [allVideos];
    }

    // Sắp xếp videos theo ngày đăng (mới nhất trước)
    allVideos.sort((a, b) => {
      const dateA = new Date(a.publishTime || 0);
      const dateB = new Date(b.publishTime || 0);
      return dateB - dateA;
    });

    // Tính tổng số trang
    totalPages = Math.ceil(allVideos.length / VIDEOS_PER_PAGE);

    // Hiển thị trang đầu tiên
    displayPage(1);
  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error">
        Lỗi: ${error.message}<br>
        Vui lòng kiểm tra file ${VIDEO_JSON_FILE} có tồn tại không.
      </div>
    `;
    console.error("Error loading videos:", error);
  }
}

// Load videos khi trang được tải
window.addEventListener("DOMContentLoaded", loadVideos);
