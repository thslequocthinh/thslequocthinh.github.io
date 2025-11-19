import cv2
import numpy as np
from PIL import Image


def remove_black_background(input_path, output_path):
    """
    Tách background màu đen, giữ lại phần người
    """
    # Đọc ảnh
    img = cv2.imread(input_path)

    # Chuyển sang grayscale để phân tích
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Tạo mask: phân biệt background đen với phần người
    # Background thường có giá trị pixel rất thấp (gần 0)
    # Phần người, tóc, quần áo có giá trị cao hơn

    # Sử dụng adaptive threshold để xử lý tốt hơn
    _, mask = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)

    # Morphological operations để làm mịn và loại bỏ noise
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    # Làm mịn viền mask
    mask = cv2.GaussianBlur(mask, (5, 5), 0)

    # Tạo ảnh RGBA (có alpha channel)
    b, g, r = cv2.split(img)
    rgba = cv2.merge([r, g, b, mask])

    # Lưu ảnh kết quả
    result = Image.fromarray(rgba)
    result.save(output_path, "PNG")

    print(f"Đã lưu ảnh tại: {output_path}")

    return rgba


# Phương pháp 2: Sử dụng GrabCut (tự động phát hiện foreground)
def remove_background_grabcut(input_path, output_path):
    """
    Sử dụng thuật toán GrabCut để tách background tự động
    """
    # Đọc ảnh
    img = cv2.imread(input_path)

    # Tạo mask
    mask = np.zeros(img.shape[:2], np.uint8)

    # Tạo background và foreground models
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    # Định nghĩa rectangle xung quanh object (giả sử object ở giữa)
    height, width = img.shape[:2]
    rect = (
        int(width * 0.05),
        int(height * 0.05),
        int(width * 0.95),
        int(height * 0.95),
    )

    # Áp dụng GrabCut
    cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)

    # Tạo mask cuối cùng
    mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")

    # Làm mịn mask
    kernel = np.ones((5, 5), np.uint8)
    mask2 = cv2.morphologyEx(mask2, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask2 = cv2.GaussianBlur(mask2, (5, 5), 0)

    # Chuyển về 0-255
    alpha = (mask2 * 255).astype(np.uint8)

    # Tạo ảnh RGBA
    b, g, r = cv2.split(img)
    rgba = cv2.merge([r, g, b, alpha])

    # Lưu ảnh
    result = Image.fromarray(rgba)
    result.save(output_path, "PNG")

    print(f"Đã lưu ảnh tại: {output_path}")

    return rgba


# Phương pháp 3: Kết hợp nhiều kỹ thuật (Recommended)
def remove_background_advanced(input_path, output_path, threshold=30):
    """
    Phương pháp nâng cao kết hợp nhiều kỹ thuật
    """
    img = cv2.imread(input_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Bước 1: Phát hiện vùng tối (background)
    _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)

    # Bước 2: Phát hiện edges
    edges = cv2.Canny(gray, 50, 150)

    # Bước 3: Kết hợp binary và edges
    mask = cv2.bitwise_or(binary, edges)

    # Bước 4: Morphological operations
    kernel_close = np.ones((7, 7), np.uint8)
    kernel_open = np.ones((3, 3), np.uint8)

    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_close, iterations=3)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_open, iterations=1)

    # Bước 5: Tìm contours và giữ contour lớn nhất
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        # Tìm contour lớn nhất (giả sử đó là người)
        largest_contour = max(contours, key=cv2.contourArea)

        # Tạo mask mới chỉ với contour lớn nhất
        mask_clean = np.zeros_like(mask)
        cv2.drawContours(mask_clean, [largest_contour], -1, 255, -1)

        # Làm mịn viền
        mask_clean = cv2.GaussianBlur(mask_clean, (7, 7), 0)

        mask = mask_clean

    # Bước 6: Tạo ảnh RGBA
    b, g, r = cv2.split(img)
    rgba = cv2.merge([r, g, b, mask])

    # Lưu kết quả
    result = Image.fromarray(rgba)
    result.save(output_path, "PNG")

    print(f"Đã lưu ảnh tại: {output_path}")

    return rgba


# Sử dụng:
if __name__ == "__main__":
    input_image = "img/Screenshot_from_2025-11-18_15-33-05-removebg-preview.png"  # Đường dẫn ảnh đầu vào
    output_image = "anh.png"  # Đường dẫn ảnh đầu ra

    # Thử phương pháp 1 (đơn giản)
    # remove_black_background(input_image, output_image)

    # Thử phương pháp 2 (GrabCut - tự động)
    # remove_background_grabcut(input_image, output_image)

    # Thử phương pháp 3 (nâng cao - recommended)
    remove_background_advanced(input_image, output_image, threshold=30)
