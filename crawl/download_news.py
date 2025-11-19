import json
import requests
from bs4 import BeautifulSoup
import time
from typing import List, Dict


def crawl_article(url: str) -> Dict:
    """
    Crawl thông tin từ một bài báo

    Args:
        url: Đường dẫn đến bài báo

    Returns:
        Dictionary chứa title, time_post, content
    """
    try:
        # Gửi request để lấy nội dung trang
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        # Parse HTML
        soup = BeautifulSoup(response.content, "html.parser")

        # 1. Lấy tiêu đề
        title_tag = soup.find("h1", class_="article__title cms-title")
        title = title_tag.get_text(strip=True) if title_tag else ""

        # 2. Lấy thời gian đăng
        time_tag = soup.find("time", class_="time")
        time_post = time_tag.get_text(strip=True) if time_tag else ""

        # 3. Lấy nội dung
        content_parts = []

        # Phần 1: Sapo (mô tả ngắn)
        sapo_tag = soup.find("h2", class_="article__sapo cms-desc")
        if sapo_tag:
            content_parts.append(sapo_tag.get_text(strip=True))

        # Phần 2: Nội dung chính
        body_div = soup.find("div", class_="article__body zce-content-body cms-body")
        if body_div:
            paragraphs = body_div.find_all("p")
            for p in paragraphs:
                text = p.get_text(strip=True)
                if text:  # Chỉ thêm nếu có nội dung
                    content_parts.append(text)

        # Phần 3: Notebox (ghi chú)
        notebox_div = soup.find("div", class_="notebox align-center cms-note")
        if notebox_div:
            note_paragraphs = notebox_div.find_all("p")
            for p in note_paragraphs:
                text = p.get_text(strip=True)
                if text:
                    content_parts.append(text)

        # Ghép tất cả content lại
        content = "\n\n".join(content_parts)

        return {
            "title": title,
            "time_post": time_post,
            "content": content,
            "url": url,
            "status": "success",
        }

    except Exception as e:
        print(f"Lỗi khi crawl {url}: {str(e)}")
        return {
            "title": "",
            "time_post": "",
            "content": "",
            "url": url,
            "status": f"error: {str(e)}",
        }


def crawl_articles_from_json(
    input_json_path: str, output_json_path: str, delay: float = 1.0
):
    """
    Crawl nhiều bài báo từ file JSON chứa danh sách URL

    Args:
        input_json_path: Đường dẫn file JSON đầu vào (chứa list URL hoặc dict)
        output_json_path: Đường dẫn file JSON đầu ra
        delay: Thời gian chờ giữa các request (giây)
    """
    # Đọc file JSON đầu vào
    try:
        with open(input_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"Lỗi khi đọc file JSON: {e}")
        return

    # Xử lý data để lấy danh sách URL
    urls = []
    if isinstance(data, list):
        # Nếu data là list các URL hoặc dict
        for item in data:
            if isinstance(item, str):
                urls.append(item)
            elif isinstance(item, dict) and "url" in item:
                urls.append(item["url"])
    elif isinstance(data, dict):
        # Nếu data là dict có key 'urls' hoặc 'articles'
        if "urls" in data:
            urls = data["urls"]
        elif "articles" in data:
            urls = data["articles"]

    print(f"Tìm thấy {len(urls)} URL để crawl")

    # Crawl từng bài báo
    results = []
    for i, url in enumerate(urls, 1):
        print(f"Đang crawl {i}/{len(urls)}: {url}")
        article_data = crawl_article(url)
        results.append(article_data)

        # Delay để tránh bị chặn
        if i < len(urls):
            time.sleep(delay)

    # Lưu kết quả vào file JSON
    try:
        with open(output_json_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\nĐã lưu {len(results)} bài báo vào {output_json_path}")

        # Thống kê
        success_count = sum(1 for r in results if r["status"] == "success")
        print(f"Thành công: {success_count}/{len(results)}")

    except Exception as e:
        print(f"Lỗi khi lưu file JSON: {e}")


# Ví dụ sử dụng
if __name__ == "__main__":
    # Cách 1: Crawl từ file JSON
    input_file = (
        "/home/namphuong/LQT/khoahocdoisong_articles.json"  # File chứa danh sách URL
    )
    output_file = "/home/namphuong/LQT/results.json"  # File lưu kết quả

    crawl_articles_from_json(input_file, output_file, delay=1.0)

    # Cách 2: Crawl một URL cụ thể
    # url = "https://example.com/article"
    # result = crawl_article(url)
    # print(json.dumps(result, ensure_ascii=False, indent=2))
