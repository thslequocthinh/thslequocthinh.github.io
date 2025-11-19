import json
import re
from docx import Document
from docx.shared import RGBColor


def is_red_paragraph(paragraph):
    """Trả về True nếu paragraph có màu đỏ (RGB 255,0,0)."""
    for run in paragraph.runs:
        color = run.font.color
        if color is not None and color.rgb is not None:
            if color.rgb == RGBColor(255, 0, 0):
                if run.text.strip():
                    return True
    return False


ALLOWED_CHAR_PATTERN = re.compile(
    r"[a-zA-Z0-9À-Ỵà-ỵĂăÂâÊêÔôƠơƯưĐđ\s,.;:!?\"'()\-\–\—…]"
)


def is_gibberish(text, threshold=0.3):
    """Loại đoạn lỗi font (nhiều ký tự lạ)."""
    text = text.strip()
    if not text:
        return True

    total = len(text)
    bad = sum(1 for ch in text if not ALLOWED_CHAR_PATTERN.match(ch))

    return (bad / total) > threshold


def docx_to_json(input_path, output_path):
    doc = Document(input_path)

    sections = []
    current_title = None
    current_content_lines = []

    for paragraph in doc.paragraphs:
        raw_text = paragraph.text
        text = raw_text.strip()

        if not text:
            continue

        if is_gibberish(text):
            continue

        if is_red_paragraph(paragraph):
            if current_title is not None:
                sections.append(
                    {
                        "tieu_de": current_title,
                        "content": "\n".join(current_content_lines).strip(),
                    }
                )

            current_title = text
            current_content_lines = []

        else:
            if current_title is not None:
                current_content_lines.append(text)
            else:
                continue

    # Thêm mục cuối
    if current_title is not None:
        sections.append(
            {
                "tieu_de": current_title,
                "content": "\n".join(current_content_lines).strip(),
            }
        )

    # ============================
    # ⭐ Lọc bỏ mục có content rỗng
    # ============================
    filtered_sections = [sec for sec in sections if sec["content"].strip() != ""]

    # Gán lại id tự động tăng
    for idx, sec in enumerate(filtered_sections, start=1):
        sec["id"] = idx

    # Xuất file JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(filtered_sections, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    input_docx = (
        "../news/B2-FBker-văn thơ toàn tập.docx"  # thay bằng tên file docx của bạn
    )
    output_json = "../news/B2-FBker-văn thơ toàn tập.json"  # tên file json xuất ra

    docx_to_json(input_docx, output_json)
    print(f"Đã xuất dữ liệu sang {output_json}")
