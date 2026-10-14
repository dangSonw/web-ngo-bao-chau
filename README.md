# Ngô Bảo Châu

Home, About Me, Inquiry, Community và Sprituality đã được triển khai theo các frame Figma 1440 × 744, căn bố cục theo chiều ngang và chiều dọc, thích ứng từ mobile đến 4K. Cả bốn mục Home → About Me/Inquiry/Community/Sprituality đều hoạt động qua SPA.

Nguồn: [Ngô Bảo CHâu trên Figma](https://www.figma.com/design/xbGrAfGotyuHW835jkUfsn). Đã đọc trực tiếp qua Figma Console MCP Desktop Bridge. API REST chưa sử dụng được do thiếu FIGMA_ACCESS_TOKEN.

## Cấu trúc

Theo web-linh-anh-folio: src/components, src/pages, src/data, src/lib, design và public/assets. Dùng cùng phiên bản dependencies trong package-lock của dự án mẫu; không sao chép nội dung hay assets của Linh Anh.

- src/main.jsx: React + BrowserRouter; URL con được reset về / lúc khởi động.
- src/App.jsx và src/pages/Home.jsx: entrypoint routes và giao diện Home.
- src/pages/Home.css: bố cục theo tỷ lệ frame, canvas tối đa 2560px, chữ tối thiểu 16px ở desktop và 18px ở mobile/tablet. Dưới 1101px hoặc cao tối đa 600px, bố cục chuyển sang title phía trên/menu phía dưới; dưới 561px, menu một cột. Có thể cuộn dọc trên màn hình thấp.
- src/pages/AboutMe.jsx và AboutMe.css: giới thiệu About Me cùng The Logician, The Adventurer và The Seeker; dữ liệu nguồn ở src/data/aboutPages.json. Desktop giữ bố cục và crop nguồn. Tablet/mobile xếp lại chữ, chứng nhận và hành tinh; cho cuộn dọc để không cắt nội dung.
- src/components/SubpageLayout.jsx: menu chung giữ mounted khi chuyển giữa bốn màn hình About Me. Chấm điều hướng có vùng chạm 40px, nên khoảng cách rộng hơn các chấm 15px trong Figma; đây là thích ứng cho khả năng thao tác. Phím Left/Right/Home/End hoạt động khi focus ở điều hướng này. Bốn chấm About chỉ gồm overview, Logician, Adventurer, Seeker; không có Home. Inquiry có năm chấm theo đúng năm màn hình. Dấu cách chuyển tuần hoàn trong từng nhóm; bỏ qua nhập liệu, modifier và key repeat. Home mở bằng menu trên cùng; reset lúc reload vẫn theo quy tắc workspace.
- src/lib/useReducedMotion.js: theo dõi tùy chọn reduced motion của hệ điều hành; transition tắt khi bật.
- src/components/CertificateOrbit.jsx và CertificateOrbit.css: chứng nhận Logician xoay nhẹ trên vòng nghiêng có chiều sâu theo bản phác thảo. Chỉ ảnh ở lớp trước nhận chuột. Tab/Shift+Tab duyệt đủ 11 ảnh và đưa ảnh được chọn vào giữa; Escape thoát để tiếp tục điều hướng. Hover dừng vòng, đưa ảnh bên cạnh vào giữa và phóng lớn; rời ảnh/vùng ảnh thì thu về vị trí trước đó và tiếp tục. Touch chọn ảnh, chạm ngoài để đóng; Escape bỏ chọn. Reduced motion bỏ tự xoay và chuyển động thu/phóng.
- src/lib/certificateOrbit.js và scripts/check-certificate-orbit.mjs: công thức vòng quay, lớp trước/sau và kiểm tra centering bằng Node. Chứng nhận Logician dùng ảnh gốc 1508–2048px lấy trực tiếp từ Figma, cho cả vòng quay và phóng lớn; ảnh vẽ ở kích thước hiển thị thay vì scale lớp raster nhỏ. Thu/phóng chậm hơn (~1 giây đạt 95%). Nguồn ảnh: design/orbit-source-assets.json.
- src/components/PlanetOrbit.jsx và PlanetOrbit.css: năm hành tinh The Seeker quay quanh tâm chung (1000,395) của bố cục nguồn, giữ đứng thẳng; một vòng 180 giây. Quỹ đạo elip theo chiều dọc giúp ảnh không chạm chữ/menu; reduced motion dừng quay. Chuyển động dùng translate3d với tọa độ thập phân, không cập nhật left/top mỗi frame; ResizeObserver giữ đúng vị trí khi đổi viewport. Kiểm tra hiệu năng ở scripts/check-planet-motion.mjs (cần Playwright/Chrome; có thể truyền URL module Playwright làm đối số). Kết quả sửa rung giật: design/orbit-qa/planet-smoothness-verification.json.
- src/pages/Inquiry.jsx và Inquiry.css: năm màn hình giới thiệu, WICO, ICAN, Research, Theicption Platform; dữ liệu từ src/data/inquiryPages.json. Giữ ảnh, crop và vị trí Figma ở desktop; ảnh/hành tinh và nội dung được xếp lại ở tablet/mobile. Bốn hành tinh ở intro dẫn đến bốn tab; hai link Research mở trang nguồn trong tab mới. Theicption dùng ảnh nguồn của giao diện, không có URL ứng dụng trong thiết kế.
- scripts/check-section-navigation.mjs: kiểm tra hai vòng dấu cách, nút điều hướng không chứa Home, wrap bằng ArrowRight và giữ phím; cần Playwright/Chrome, có thể truyền URL module Playwright.
- design/inquiry-qa/: 65 trường hợp viewport, screenshot, kiểm tra tương tác, HMR và Space; design/inquiry-verification.json ghi bằng chứng. Nền chỉ composited từ các lớp background Figma, không có chữ/tab trong ảnh. Typography Conthrax là SVG từ glyph được lưu trong Figma; các clone tạm đã được xóa.
- src/pages/Community.jsx và Community.css: giới thiệu cộng đồng và năm dự án The Tay Roots, Ban Sung Project, Y4C, “Viet Nam Tinh Hoa” Concert, Bright Paths Mù Cang Chải; dữ liệu ở src/data/communityPages.json. Giữ ảnh, crop và chữ Figma; năm hành tinh và nhãn ở intro dẫn đến dự án. Sáu chấm và dấu cách chuyển tuần hoàn trong Community, không về Home. Links Facebook/bài báo mở tab mới. Desktop giữ các slot ảnh; nội dung/link chạy theo luồng để không chồng và có thể tăng chiều cao ở trang dài. Caption Bright Paths được đưa vào trong canvas; mobile dùng nhãn chữ đọc được và lưới hai cột.
- design/community-live-nodes.json, community-type-exports.json và community-qa/: dữ liệu live Figma, SVG outline, 90 viewport cases và screenshot Community; nền intro chỉ gồm background nguồn, không chứa text/controls. Các nền detail được đối chiếu chính xác với Inquiry trước khi tái sử dụng. Codegraph hoạt động ở bước trước sửa nhưng transport đóng khi reindex sau sửa; phạm vi cuối đã được đối chiếu trực tiếp với source.
- src/pages/Spirituality.jsx và Spirituality.css: trang Sprituality có hai nhánh Wuxing và Planets; dữ liệu ở src/data/spiritualityPages.json. Wuxing gồm giới thiệu, Fire, Wood, Earth, Metal, Water, Conclusion (7 màn hình). Planets gồm giới thiệu, Venus, Mars, Saturn, Moon (5 màn hình). Mũi tên và chấm lặp trong nhánh hiện tại. Dấu cách đi liên tục qua 7 màn Wuxing, 5 màn Planets rồi trở lại Wuxing. Click mục Sprituality trên menu để quay lại trang chọn nhánh; Home vẫn mở bằng menu Home. Collage mobile giữ đúng bố cục và tỷ lệ ảnh nguồn. Các tag (wuxing) được đưa ra khỏi chữ lớn ở các frame nguồn bị chồng.
- design/spirituality-live-nodes.json, spirituality-type-exports.json, spirituality-background-exports.json và spirituality-qa/: node live Figma, 15 SVG glyph export, ba nền chỉ gồm lớp background, 195 viewport cases cho 13 màn hình. Frame 73:4 được đưa vào phần Wuxing Conclusion dù tên frame là Community. Codegraph không truy cập được (Transport closed); source/imports/routes được kiểm tra trực tiếp.
- src/data/figmaPages.json: danh sách 29 frame, tiêu đề, nhóm và ảnh tham chiếu.
- design/figma-document.json: cây node, vị trí, typography, fills, effects, transforms và reactions từ Figma.
- design/asset-inventory.json: inventory layer nguồn.
- design/screenshots/: 29 ảnh frame PNG ở kích thước thiết kế 1440 × 744.
- public/assets/manifest.json: mapping 155 layer sang 94 assets riêng biệt.
- public/assets/{home,about,inquiry,community,spirituality}/: ảnh nguồn được đóng gói thành WebP lossless và SVG; giữ độ phân giải, crop, filters, alpha và profile màu. 91 bản chuyển đổi/alias đã được đối chiếu từng pixel với ảnh gốc.
- public/assets/home/type/: năm SVG tiêu đề outline từ text nodes Figma, giữ hình dạng chữ Conthrax và có tên chữ tương ứng cho screen reader. Figma báo thiếu font Conthrax; export thực hiện qua bản sao vector tạm từ hình dạng glyph đã lưu và đã xóa các bản sao sau export.
- public/assets/about/type/: typography Conthrax lấy từ Figma thành SVG outline; background intro composited từ bốn lớp ảnh/gradient nguồn, không có chữ trong ảnh nền.
- public/assets/fonts/: Actor Regular và Abhaya Libre Regular từ Google Fonts, cùng OFL. Stack Abhaya Libre / Times New Roman / serif dùng glyph fallback cho dấu tiếng Việt chưa có trong Abhaya Libre. Không nhúng font software Conthrax.
- design/fonts.json: tình trạng fonts và nguồn.
- design/home-qa/: screenshots và kết quả kiểm thử trình duyệt của Home.
- design/about-qa/: screenshots và QA của bốn màn hình About Me, cùng kiểm tra Home sau khi nối menu.
- design/orbit-qa/: QA mới cho vòng ảnh Logician, thay thế bố cục chứng nhận tĩnh trong hồ sơ About Me trước đó; assets gốc ở design/orbit-source-assets.json; motion-results.json kiểm tra Tab/Shift+Tab, ảnh gốc, quỹ đạo năm hành tinh, responsive và navigation.

Manifest chỉ gộp các layer có cùng thuộc tính render; mỗi layer vẫn giữ nodeId, frameId, fills và đường dẫn file. Màu nền, hình học CSS và text nằm trong dữ liệu thiết kế, không bị raster hóa thành toàn bộ giao diện. Screenshots dùng để đối chiếu.

## Chạy dự án

```powershell
cd D:\Web\web-ngo-bao-chau
npm ci
npm run dev
npm run build
```

Dev và preview dùng cổng 5177 với strictPort. Toàn bộ giao diện tối dần về đen trong 220ms, đổi trang khi đã che kín, chờ ảnh/font rồi hiện trang mới trong 280ms. Menu chung nằm trong SiteNavigation ở ngoài routes và ngoài vùng chuyển cảnh đen, giữ cùng DOM khi chuyển About/Inquiry/Community/Sprituality. Lớp đen bắt đầu ngay dưới menu, kể cả khi menu xuống hàng trên mobile. Reduced motion chuyển ngay, bỏ fade.

Mở Home rồi chọn About Me. Các routes trong phiên: /about-me, /about-me/logician, /about-me/adventurer, /about-me/seeker. Reload hoặc mở mới URL con trở về Home theo quy tắc workspace; Back/Forward trong phiên giữ điều hướng bình thường.

## Trạng thái

Hoàn tất Home, About Me, Inquiry, Community và Sprituality, gồm Wuxing/Planets. QA mới nhất toàn website ở design/site-refresh-verification.json và design/site-refresh-qa/: tăng chữ thêm 2px, căn lại bố cục, chuyển cảnh đen và vòng Space nối Wuxing/Planets. Chạy lại bằng scripts/check-site-layout.mjs (cần Playwright/Chrome, đối số tùy chọn là URL module Playwright). Hồ sơ design/spirituality-verification.json và design/spirituality-qa/ ghi bước triển khai ban đầu. QA mới trong design/about-verification.json và design/about-qa/; các hồ sơ chuẩn bị/Home trước đó là kết quả của các bước tương ứng. Dự án hiện có Git repository; thay đổi được commit sau QA theo quy tắc workspace.


## Assets và Git

- Assets phục vụ web giảm từ 107,3 MiB xuống 51,1 MiB. 29 ảnh/vector không được dùng được chuyển vào kho nguồn riêng; ảnh gốc của các bản WebP cũng được giữ tại `D:\Web\_local-assets\web-ngo-bao-chau\originals`.
- Screenshot QA và ảnh tham chiếu trong `design/` vẫn có ở máy, nhưng không được track trong Git (khoảng 565,6 MiB). JSON bằng chứng và scripts kiểm tra vẫn được track; chạy scripts để tạo lại ảnh QA.
- `python scripts/optimize-assets.py` kiểm tra tài nguyên đang dùng; `python scripts/optimize-assets.py --verify` đối chiếu lossless với kho ảnh gốc (cần Pillow và kho nguồn local). `--apply` đóng gói các PNG mới, giữ bản gốc ngoài repository.
- Commit QA chưa push trước đó được gộp vào commit tối ưu để lần push tới không upload ảnh QA của commit cũ. Bản sao lịch sử Git trước khi gộp được lưu ở `D:\Web\_local-assets\web-ngo-bao-chau\before-asset-cleanup.bundle`.
- Lịch sử đã push lên GitHub được giữ nguyên; việc bỏ track làm nhẹ cây file hiện tại và lần push mới, không xóa các blob đã tồn tại trong lịch sử remote. Không dùng force push cho thay đổi này.
