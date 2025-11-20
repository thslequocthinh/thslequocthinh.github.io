// ===== CẤU HÌNH =====
const JSON_FILE_PATH = "news/B2-FBker-văn thơ toàn tập.json"; // Đường dẫn đến file JSON của bạn

// ===== HÀM TẠO EXCERPT TỰ ĐỘNG =====
function generateExcerpt(content) {
  if (!content) return "";

  // Xử lý xuống dòng \n thành khoảng trắng
  const cleanContent = content.replace(/\\n/g, " ").replace(/\n/g, " ");

  // Tách thành các câu (dùng dấu chấm, chấm hỏi, chấm than, dấu 3 chấm)
  const sentences = cleanContent.match(/[^.!?…]+[.!?…]+/g) || [cleanContent];

  // Lấy 2 câu đầu tiên
  const excerptSentences = sentences.slice(0, 2);

  // Nối lại và thêm dấu ...
  let excerpt = excerptSentences.join(" ").trim();

  // Giới hạn độ dài nếu quá dài (tối đa 200 ký tự)
  if (excerpt.length > 200) {
    excerpt = excerpt.substring(0, 200).trim();
  }

  return excerpt + "...";
}

// ===== HÀM TẠO CARD HTML (KHÔNG CÓ ICON) =====
function createCard(post, index) {
  const excerpt = generateExcerpt(post.content);

  return `
        <div class="card" data-id="${post.id}" data-index="${index}">
            <div class="card-content">
                <h2 class="card-title">${
                  post.tieu_de || post.title || "Không có tiêu đề"
                }</h2>
                <p class="card-excerpt">${excerpt}</p>
            </div>
        </div>
    `;
}

// ===== LOAD DỮ LIỆU TỪ JSON =====
async function loadPosts() {
  const cardsWrapper = document.getElementById("cardsWrapper");

  try {
    // Hiển thị loading
    cardsWrapper.innerHTML = '<div class="loading">Đang tải bài viết...</div>';

    // Fetch data từ JSON file
    const response = await fetch(JSON_FILE_PATH);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts = await response.json();

    // Kiểm tra dữ liệu
    if (!posts || posts.length === 0) {
      cardsWrapper.innerHTML =
        '<div class="loading">Chưa có bài viết nào.</div>';
      return;
    }

    // Sắp xếp theo ID giảm dần (bài mới nhất lên đầu)
    posts.sort((a, b) => b.id - a.id);

    // Render cards
    renderCards(posts);

    console.log(`✅ Đã load ${posts.length} bài viết`);
  } catch (error) {
    console.error("❌ Lỗi khi load dữ liệu:", error);
    cardsWrapper.innerHTML = `
            <div class="loading">
                Không thể tải bài viết.<br>
                <small>Lỗi: ${error.message}</small><br>
                <small>Vui lòng kiểm tra đường dẫn file JSON: "${JSON_FILE_PATH}"</small>
            </div>
        `;
  }
}

// ===== RENDER TẤT CẢ CARDS =====
function renderCards(posts) {
  const cardsWrapper = document.getElementById("cardsWrapper");

  if (!cardsWrapper) {
    console.error("❌ Không tìm thấy cards wrapper");
    return;
  }

  // Tạo HTML cho tất cả cards
  const cardsHTML = posts
    .map((post, index) => createCard(post, index))
    .join("");

  // Gắn vào DOM
  cardsWrapper.innerHTML = cardsHTML;

  // Thêm event listener cho mỗi card
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const postId = card.dataset.id;

      // CHUYỂN SANG TRANG DETAIL_BLOG.HTML
      window.location.href = `detail_blog.html?id=${postId}`;

      console.log(`📖 Chuyển đến bài viết ID: ${postId}`);
    });
  });
}

// ===== HORIZONTAL SCROLL BUTTONS =====
function setupScrollButtons() {
  const scrollLeftBtn = document.getElementById("scrollLeft");
  const scrollRightBtn = document.getElementById("scrollRight");
  const cardsWrapper = document.getElementById("cardsWrapper");

  if (!scrollLeftBtn || !scrollRightBtn || !cardsWrapper) {
    console.error("❌ Không tìm thấy scroll buttons");
    return;
  }

  // Tính toán khoảng cách scroll
  const getScrollAmount = () => {
    const card = document.querySelector(".card");
    if (!card) return 400;

    const cardWidth = card.offsetWidth;
    const gap = 40; // 2.5rem ≈ 40px
    return cardWidth + gap;
  };

  // Scroll sang trái
  scrollLeftBtn.addEventListener("click", () => {
    cardsWrapper.scrollBy({
      left: -getScrollAmount(),
      behavior: "smooth",
    });
  });

  // Scroll sang phải
  scrollRightBtn.addEventListener("click", () => {
    cardsWrapper.scrollBy({
      left: getScrollAmount(),
      behavior: "smooth",
    });
  });

  // Cập nhật trạng thái buttons
  const updateButtonState = () => {
    const scrollLeft = cardsWrapper.scrollLeft;
    const maxScroll = cardsWrapper.scrollWidth - cardsWrapper.clientWidth;

    // Disable/enable buttons
    scrollLeftBtn.disabled = scrollLeft <= 1;
    scrollRightBtn.disabled = scrollLeft >= maxScroll - 1;
  };

  // Lắng nghe sự kiện scroll
  cardsWrapper.addEventListener("scroll", updateButtonState);

  // Cập nhật lần đầu sau khi cards được render
  setTimeout(updateButtonState, 100);

  // ===== SCROLL NGANG BẰNG CON LĂN CHUỘT (CHỈ TRÊN DESKTOP) =====
  let isMouseWheelEnabled = false;

  // Xử lý sự kiện lăn chuột
  const handleWheelScroll = (e) => {
    // Chỉ chặn scroll khi đang hover vào vùng cards
    e.preventDefault();
    e.stopPropagation();

    // deltaY > 0: lăn xuống → scroll sang phải
    // deltaY < 0: lăn lên → scroll sang trái
    const scrollAmount = e.deltaY * 4; // Nhân 4 để scroll mượt hơn

    cardsWrapper.scrollBy({
      left: scrollAmount,
      behavior: "auto", // Dùng 'auto' để scroll mượt hơn
    });
  };

  // Kích hoạt/vô hiệu hóa mouse wheel scroll dựa vào kích thước màn hình
  const toggleMouseWheelScroll = () => {
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop && !isMouseWheelEnabled) {
      // Kích hoạt trên desktop
      cardsWrapper.addEventListener("wheel", handleWheelScroll, {
        passive: false,
      });
      isMouseWheelEnabled = true;
      console.log("🖱️ Mouse wheel scroll: ENABLED (Desktop)");
    } else if (!isDesktop && isMouseWheelEnabled) {
      // Vô hiệu hóa trên mobile/tablet
      cardsWrapper.removeEventListener("wheel", handleWheelScroll);
      isMouseWheelEnabled = false;
      console.log("📱 Mouse wheel scroll: DISABLED (Mobile/Tablet)");
    }
  };

  // Kích hoạt lần đầu
  toggleMouseWheelScroll();

  // Lắng nghe sự kiện resize
  window.addEventListener("resize", toggleMouseWheelScroll);
}

// ===== KHỞI ĐỘNG KHI TRANG LOAD =====
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Blog page loaded!");

  // Load dữ liệu từ JSON
  await loadPosts();

  // Setup scroll buttons và mouse wheel
  setupScrollButtons();
});
