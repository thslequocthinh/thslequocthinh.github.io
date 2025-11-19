import os
import json
import time

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys


def init_driver():
    chrome_path = os.getenv("CHROMEDRIVER_PATH", "chromedriver")
    options = Options()
    # options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
    service = Service(chrome_path)
    driver = webdriver.Chrome(service=service, options=options)
    return driver


def crawl_khoahocdoisong():
    url = "https://khoahocdoisong.vn/tim-kiem/?q=l%C3%AA%20qu%E1%BB%91c%20th%E1%BB%8Bnh&siteId=1"

    driver = init_driver()

    try:
        driver.get(url)
        time.sleep(3)

        print("Bắt đầu cuộn để load tất cả bài viết...")

        # Phương pháp 1: Cuộn chậm và liên tục
        last_count = 0
        stable_count = 0
        scroll_attempts = 0
        max_scroll_attempts = 50  # Tối đa 50 lần cuộn

        while scroll_attempts < max_scroll_attempts:
            # Đếm số bài viết hiện tại
            current_articles = driver.find_elements(By.CSS_SELECTOR, "article.story")
            current_count = len(current_articles)

            print(f"Lần cuộn {scroll_attempts + 1}: Tìm thấy {current_count} bài viết")

            # Cuộn xuống một đoạn (không phải cuối trang)
            driver.execute_script("window.scrollBy(0, 800);")
            time.sleep(1.5)

            # Kiểm tra xem có bài viết mới không
            if current_count > last_count:
                last_count = current_count
                stable_count = 0
            else:
                stable_count += 1

            # Nếu số lượng bài viết không thay đổi sau 5 lần cuộn
            if stable_count >= 5:
                # Thử cuộn xuống hết cỡ
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)

                new_count = len(driver.find_elements(By.CSS_SELECTOR, "article.story"))
                if new_count == current_count:
                    print(f"Đã load hết! Tổng cộng: {new_count} bài viết")
                    break
                else:
                    last_count = new_count
                    stable_count = 0

            scroll_attempts += 1

        # Phương pháp 2: Nhấn phím END nhiều lần (backup)
        print("\nThử phương pháp cuộn bằng phím END...")
        body = driver.find_element(By.TAG_NAME, "body")
        for i in range(10):
            body.send_keys(Keys.END)
            time.sleep(1)
            new_count = len(driver.find_elements(By.CSS_SELECTOR, "article.story"))
            print(f"Sau khi nhấn END lần {i+1}: {new_count} bài viết")

        # Cuộn lên đầu trang rồi cuộn xuống lại (đảm bảo tất cả đã render)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(3)

        # Lấy tất cả bài viết
        # Thử nhiều selector khác nhau
        articles = driver.find_elements(By.CSS_SELECTOR, "article.story")

        if len(articles) == 0:
            print("Không tìm thấy bài viết với selector 'article.story'")
            # Thử selector khác
            articles = driver.find_elements(By.TAG_NAME, "article")

        print(f"\n{'='*50}")
        print(f"Tổng số bài viết tìm thấy: {len(articles)}")
        print(f"{'='*50}\n")

        results = []
        current_id = 1

        for idx, article in enumerate(articles, 1):
            try:
                # Kiểm tra xem article có class 'story' không
                article_class = article.get_attribute("class")

                # Lấy tiêu đề
                h3 = article.find_element(By.CSS_SELECTOR, "h3.story__heading")
                a_tag = h3.find_element(By.TAG_NAME, "a")

                title = a_tag.text.strip()
                link = a_tag.get_attribute("href")

                if not title:  # Bỏ qua bài không có tiêu đề
                    continue

                if link and link.startswith("/"):
                    link = "https://khoahocdoisong.vn" + link

                # Lấy ảnh
                img_url = None
                try:
                    # Thử tìm img trong article
                    imgs = article.find_elements(By.TAG_NAME, "img")
                    for img in imgs:
                        img_url = (
                            img.get_attribute("data-src")
                            or img.get_attribute("src")
                            or img.get_attribute("data-original")
                            or img.get_attribute("data-lazy-src")
                        )
                        if img_url:
                            break

                    if img_url and img_url.startswith("/"):
                        img_url = "https://khoahocdoisong.vn" + img_url
                except:
                    pass

                # Lấy mô tả
                description = None
                try:
                    desc_elem = article.find_element(
                        By.CSS_SELECTOR, "div.story__summary, p.story__summary"
                    )
                    description = desc_elem.text.strip()
                except:
                    pass

                result_item = {
                    "id": current_id,
                    "tieu_de": title,
                    "url": link,
                    "anh": img_url,
                    "mo_ta": description,
                    "article_class": article_class,
                }

                results.append(result_item)
                print(f"[{current_id}] {title[:60]}...")

                current_id += 1

            except Exception as e:
                print(f"Lỗi bài viết {idx}: {e}")
                continue

        # Lưu file
        output_path = "/home/namphuong/LQT/khoahocdoisong_articles.json"
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"\n{'='*50}")
        print(f"✓ Đã lưu {len(results)} bài viết vào: {output_path}")
        print(
            f"✓ Số bài có ảnh: {sum(1 for r in results if r.get('anh'))}/{len(results)}"
        )
        print(f"{'='*50}")

    except Exception as e:
        print(f"Lỗi: {e}")
        import traceback

        traceback.print_exc()
        driver.save_screenshot("/home/namphuong/LQT/error_screenshot.png")

        # Lưu HTML để debug
        with open("/home/namphuong/LQT/page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)

    finally:
        driver.quit()


if __name__ == "__main__":
    crawl_khoahocdoisong()
