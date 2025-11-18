import json
import os
from urllib.parse import urlparse
import requests

# ----- CẤU HÌNH -----
JSON_PATH = (
    "/home/namphuong/LQT/khoahocdoisong_articles.json"  # đường dẫn file json của bạn
)
DOWNLOAD_DIR = "/home/namphuong/LQT/img_download/"  # thư mục lưu ảnh

# Tạo thư mục nếu chưa tồn tại
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Đọc file JSON
with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# Nếu file chỉ là 1 object duy nhất thì chuyển thành list
if isinstance(data, dict):
    data = [data]

for item in data:
    img_url = item.get("anh")
    article_id = item.get("id")

    # Bỏ qua nếu thiếu id hoặc url ảnh
    if not img_url or article_id is None:
        continue

    # Lấy phần mở rộng file từ URL (.jpg, .png, .webp, ...)
    parsed = urlparse(img_url)
    _, ext = os.path.splitext(parsed.path)
    if not ext:  # nếu không có ext, đặt mặc định
        ext = ".jpg"

    # Đặt tên file theo id
    filename = f"{article_id}{ext}"
    filepath = os.path.join(DOWNLOAD_DIR, filename)

    try:
        print(f"Đang tải ảnh {img_url} -> {filepath}")
        resp = requests.get(img_url, timeout=15)
        resp.raise_for_status()  # báo lỗi nếu HTTP lỗi

        with open(filepath, "wb") as img_file:
            img_file.write(resp.content)

    except Exception as e:
        print(f"Lỗi khi tải ảnh cho id {article_id}: {e}")

print("Hoàn thành tải ảnh.")
