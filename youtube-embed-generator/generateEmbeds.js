// generateEmbeds.js

const axios = require("axios");
const fs = require("fs");

// TODO: Thay giá trị bên dưới bằng của bạn
const API_KEY = "AIzaSyADk5uUdeEcQEURLmkFaqJR7YLzLNOWHoI";
const CHANNEL_ID = "UCVo4FrYvFVkwuadYTKlhBTg";
const MAX_RESULTS = 100; // số video muốn lấy

async function fetchVideos() {
  const url = "https://www.googleapis.com/youtube/v3/search";

  try {
    const res = await axios.get(url, {
      params: {
        key: API_KEY,
        channelId: CHANNEL_ID,
        part: "snippet,id",
        order: "date",
        maxResults: MAX_RESULTS,
      },
    });

    const items = res.data.items || [];
    const videos = items.filter((item) => item.id.kind === "youtube#video");

    console.log(`Lấy được ${videos.length} video.`);

    // Tạo danh sách dữ liệu để lưu JSON
    const output = videos.map((v) => {
      const videoId = v.id.videoId;
      const title = v.snippet.title.replace(/"/g, "&quot;");

      // Tạo HTML embed
      const embedHTML = `
<iframe width="560" height="315"
  src="https://www.youtube.com/embed/${videoId}"
  title="${title}"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>`;

      return {
        title: v.snippet.title,
        videoId: videoId,
        embed: embedHTML.trim(),
        thumbnail: v.snippet.thumbnails.high.url,
        publishTime: v.snippet.publishTime,
      };
    });

    // Lưu ra file JSON
    fs.writeFileSync("videos.json", JSON.stringify(output, null, 2), "utf-8");

    console.log("File videos.json đã được tạo thành công!");
  } catch (err) {
    console.error("Có lỗi xảy ra:", err.response?.data || err.message);
  }
}

fetchVideos();
