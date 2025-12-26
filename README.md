# 🏛️ Sui Charity Auction - THREEHUB Architecture

Dự án đấu giá từ thiện phi tập trung (dApp) xây dựng trên mạng lưới **Sui Blockchain**.
Hệ thống Thông báo (Notifications): Tích hợp thông báo thời gian thực qua Telegram hoặc Email khi: Có người đặt giá cao hơn, Phiên đấu giá sắp kết thúc, hoặc Bạn đã thắng cuộc.

SuiNS (Sui Name Service): Hiển thị tên định danh (ví dụ: nguyenvana.sui) thay vì các địa chỉ ví phức tạp như 0x6b17...7fce giúp giao diện thân thiện hơn.

Tính Năng Xã Hội & Cộng Đồng (Social Features) Hệ thống Xếp hạng (Leaderboard): Vinh danh những "Nhà hảo tâm" tích cực nhất dựa trên số tiền họ đã đóng góp qua các phiên đấu giá.
Xác thực Tổ chức Từ thiện: Xây dựng quy trình cấp tích xanh (Verified) cho các ví của tổ chức từ thiện để đảm bảo tiền luôn đến đúng nơi cần thiết.

Bình luận & Tương tác: Cho phép người dùng để lại lời nhắn tri ân hoặc thảo luận ngay dưới mỗi tác phẩm NFT đang đấu giá.

Quản Trị Phi Tập Trung (DAO Governance) Quyền biểu quyết: Những người sở hữu NFT "Hy Vọng" hoặc NFT từ thiện của 3HUB sẽ có quyền bỏ phiếu để quyết định tổ chức từ thiện nào sẽ được ưu tiên nhận quỹ trong tháng tới.
Quỹ cộng đồng (Community Treasury): Trích một phần nhỏ phí giao dịch để duy trì nền tảng và tổ chức các sự kiện Hackathon nhỏ cho sinh viên khác.

❤️ Lời Cảm Ơn Dự án này được lấy cảm hứng và xây dựng với lòng biết ơn sâu sắc tới Hệ sinh thái Sui Blockchain. Cảm ơn Sui đã tạo cơ hội tuyệt vời cho sinh viên chúng tôi được tham gia sân chơi Hackathon và hiện thực hóa những ý tưởng sáng tạo trên nền tảng Web3.
🎨 CHARITY AUCTION ( 3HUB ) - Nền Tảng Đấu Giá NFT Từ Thiện (Sui Hackathon 2025) CHARITY AUCTION là một ứng dụng phi tập trung (dApp) được xây dựng trên nền tảng Sui Blockchain, cho phép người dùng tạo, đấu giá và sở hữu các tác phẩm nghệ thuật kỹ thuật số (NFT) với mục đích gây quỹ từ thiện một cách minh bạch và an toàn.

✨ Tính Năng Nổi Bật Tạo NFT Từ Thiện Cá Nhân Hóa: Người dùng có thể tải lên hình ảnh tác phẩm nghệ thuật, đặt tên và mô tả để tạo ra các Charity NFT độc nhất.

Hệ Thống Đấu Giá Thời Gian Thực:

Cơ chế đếm ngược 20 giây (phiên bản Demo) giúp trải nghiệm đấu giá trở nên kịch tính.

Timer tự động kích hoạt và reset ngay khi có người đặt giá mới.

Trải Nghiệm Người Dùng (UX) Web3 Mượt Mà:

Ô nhập số tiền SUI linh hoạt, tự động kiểm tra giá đặt cao hơn giá hiện tại.

Thông báo chiến thắng rực rỡ với hiệu ứng pháo hoa khi người dùng sở hữu thành công NFT.

Bộ Sưu Tập Cá Nhân (My Collection): Quản lý toàn bộ danh sách NFT đã thắng đấu giá hoặc tự tạo, được truy vấn trực tiếp từ Blockchain.

Minh Bạch Tuyệt Đối: Mọi giao dịch đặt giá và chuyển quyền sở hữu đều được thực hiện thông qua Smart Contract trên Sui Testnet.

🛠 Công Nghệ Sử Dụng Blockchain: Sui Network (Testnet).

Smart Contract: sui Move Language.

Frontend: React, TypeScript, Tailwind CSS.

Thư viện Web3: @mysten/dapp-kit, @mysten/sui/transactions.

🚀 Thông Tin Triển Khai (Deployment) Mạng: Sui Blockchain Testnet. git clone https://github.com/jaySmith-bad/CHARITY_AUCTION.git

🚀 Tầm Nhìn Phát Triển Tương Lai cho nhóm 3HUB với dự án CHARITY AUCTION

Nâng Cấp Kỹ Thuật & Bảo Mật (Technical Excellence) Triển khai Mainnet: Đưa toàn bộ Smart Contract (Move) từ Testnet lên Mainnet để thực hiện các giao dịch giá trị thật.
Kiểm định (Security Audit): Thực hiện kiểm toán mã nguồn Move để đảm bảo không có lỗ hổng trong việc quản lý tiền đặt giá và chuyển quyền sở hữu NFT.

Lưu trữ phi tập trung (Decentralized Storage): Thay vì sử dụng URL ảnh tạm thời, tích hợp Walrus (Sui storage) hoặc IPFS để lưu trữ file ảnh gốc của NFT vĩnh viễn và không thể thay đổi.

Trải Nghiệm Người Dùng Cao Cấp (Advanced UX/UI) zkSend Integration: Cho phép người dùng gửi NFT hoặc tiền ủng hộ qua một đường link đơn giản mà không cần người nhận phải có ví Sui từ trước.

## 🚀 Tính năng
- **Smart Contract**: Viết bằng Move, đảm bảo tính minh bạch và an toàn.
- **Đấu giá thời gian thực**: Người dùng có thể đặt giá và theo dõi trực tiếp.
- **Giao diện Modern**: Sử dụng React + Vite + TailwindCSS + Framer Motion.

## 🛠️ Thông số kỹ thuật
- **Package ID**: `0x5e4414f266147c07b0b15ded6239606c78333628b4fe251b1dbaa7600c637675`
- **Network**: Sui Testnet
- **Framework**: @mysten/dapp-kit

## 📦 Hướng dẫn chạy Local
1. `cd frontend`
2. `npm install`

3. `npm run dev`

