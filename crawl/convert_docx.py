import re
import json
from docx import Document

# --------- CẤU HÌNH ---------
INPUT_DOCX = "../news/tapchibaohiemxahoi.docx"
OUTPUT_JSON = "../news/tapchibaohiem_output.json"
START_ID = 46
# ----------------------------


def read_docx_as_text(path):
    """Đọc toàn bộ nội dung file docx thành 1 chuỗi text."""
    doc = Document(path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text


def format_content(content: str):
    """
    Cứ 4 câu lại chèn '\n\n'
    """
    # Tách câu dựa trên ký tự ., !, ?
    sentences = re.split(r"(?<=[.!?])\s+", content)

    formatted = []
    for i, sentence in enumerate(sentences, start=1):
        formatted.append(sentence)
        if i % 4 == 0:  # cứ 4 câu thêm dòng trống
            formatted.append("\n\n")

    # Ghép lại
    return " ".join(formatted).replace(" \n\n ", "\n\n")


def parse_blocks(text: str, start_id: int = 46):
    """
    Tách các block: tiêu đề / hint / content
    """
    pattern = re.compile(
        r"tiêu đề\s*:\s*(.*?)\s*hint\s*:\s*(.*?)\s*content\s*(.*?)(?=(?:\n\s*tiêu đề\s*:)|\Z)",
        re.IGNORECASE | re.DOTALL,
    )

    results = []
    current_id = start_id

    for match in pattern.finditer(text):
        tieu_de = match.group(1).strip()
        mo_ta = match.group(2).strip()
        content_raw = match.group(3).strip()

        # --- chỉnh sửa content theo yêu cầu ---
        content = format_content(content_raw)

        results.append(
            {
                "id": current_id,
                "tieu_de": tieu_de,
                "title": tieu_de,
                "mo_ta": mo_ta,
                "content": content,
            }
        )
        current_id += 1

    return results


def main():
    raw_text = read_docx_as_text(INPUT_DOCX)

    records = parse_blocks(raw_text, START_ID)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"✔ Đã tạo {len(records)} mục và lưu vào file: {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
