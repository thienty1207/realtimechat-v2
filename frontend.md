# Chi Tiết Cấu Trúc Thư Mục Frontend

Dự án frontend của bạn là một ứng dụng chat thời gian thực được xây dựng bằng React, Vite, TailwindCSS và Stream Chat service. Dưới đây là giải thích chi tiết từng thư mục và thứ tự học tập phù hợp.

## 1. Các Thư Mục và File Chính

### 1.1. components
- **Chức năng**: Chứa các thành phần UI có thể tái sử dụng trong toàn bộ ứng dụng.
- **Chi tiết**:
  - `Layout.jsx` (20 dòng): Component bố cục chính bao quanh toàn bộ ứng dụng, tổ chức cấu trúc trang.
  - `Navbar.jsx` (79 dòng): Thanh điều hướng chính của ứng dụng, hiển thị thông tin người dùng, menu và các liên kết.
  - `Sidebar.jsx` (82 dòng): Thanh bên hiển thị danh sách bạn bè, cuộc trò chuyện và các tùy chọn điều hướng.
  - `FriendCard.jsx` (55 dòng): Hiển thị thông tin của một người bạn/liên hệ, bao gồm ảnh, tên và các tùy chọn tương tác.
  - `ThemeSelector.jsx` (54 dòng): Cho phép người dùng thay đổi giao diện của ứng dụng giữa nhiều theme khác nhau.
  - `CallButton.jsx` (14 dòng): Nút để bắt đầu cuộc gọi video với người dùng khác.
  - `ChatLoader.jsx`, `PageLoader.jsx` (13 dòng): Các component hiển thị trạng thái đang tải.
  - `NoFriendsFound.jsx`, `NoNotificationsFound.jsx` (13-18 dòng): Các thành phần hiển thị khi không có dữ liệu.

### 1.2. pages
- **Chức năng**: Chứa các trang chính của ứng dụng, mỗi trang tương ứng với một route.
- **Chi tiết**:
  - `SignUpPage.jsx` (171 dòng): Trang đăng ký người dùng mới, thu thập thông tin cơ bản và tạo tài khoản.
  - `LoginPage.jsx` (139 dòng): Trang đăng nhập cho người dùng đã có tài khoản.
  - `OnboardingPage.jsx` (193 dòng): Trang thiết lập thông tin chi tiết sau khi đăng ký, bao gồm thiết lập ngôn ngữ, vị trí, và ảnh đại diện.
  - `HomePage.jsx` (214 dòng): Trang chính sau khi đăng nhập, hiển thị danh sách bạn bè và các cuộc trò chuyện gần đây.
  - `ChatPage.jsx` (183 dòng): Trang hiển thị cuộc trò chuyện chi tiết với một người dùng khác.
  - `NotificationsPage.jsx` (135 dòng): Hiển thị thông báo và lời mời kết bạn.
  - `CallPage.jsx` (114 dòng): Trang quản lý cuộc gọi video/audio.

### 1.3. lib
- **Chức năng**: Chứa các hàm tiện ích và API calls.
- **Chi tiết**:
  - `api.js` (66 dòng): Định nghĩa tất cả các API endpoint và functions để giao tiếp với backend.
  - `axios.js` (9 dòng): Cấu hình Axios HTTP client, thiết lập baseURL và withCredentials.
  - `utils.js` (2 dòng): Các hàm tiện ích dùng chung trong ứng dụng.

### 1.4. hooks
- **Chức năng**: Chứa các React custom hooks để quản lý logic và trạng thái.
- **Chi tiết**:
  - `useSignUp.js` (15 dòng): Hook xử lý quá trình đăng ký, gửi dữ liệu đến backend và xử lý phản hồi.
  - `useLogin.js` (15 dòng): Hook xử lý đăng nhập, xác thực người dùng.
  - `useLogout.js` (19 dòng): Hook xử lý đăng xuất, xóa thông tin phiên người dùng.
  - `useAuthUser.js` (14 dòng): Hook lấy thông tin người dùng hiện tại đã xác thực.

### 1.5. store
- **Chức năng**: Quản lý trạng thái toàn cục của ứng dụng.
- **Chi tiết**:
  - `useThemeStore.js` (10 dòng): Zustand store quản lý theme của ứng dụng, lưu và áp dụng tùy chọn giao diện.

### 1.6. constants
- **Chức năng**: Chứa các giá trị hằng số dùng trong toàn bộ ứng dụng.
- **Chi tiết**:
  - `index.js` (198 dòng): Định nghĩa danh sách theme, ngôn ngữ và mã quốc gia tương ứng với mỗi ngôn ngữ.

### 1.7. File gốc
- `main.jsx` (22 dòng): Điểm khởi đầu của ứng dụng, thiết lập React Query, khởi tạo providers và render ứng dụng.
- `App.jsx` (111 dòng): Component chính, định nghĩa cấu trúc routes và phân quyền người dùng.
- `index.css` (35 dòng): Style toàn cục và thiết lập TailwindCSS.

## 2. Cấu Hình và Công Cụ
- **package.json**: Quản lý dependencies và scripts.
  - **Dependencies chính**:
    - `react`, `react-dom`: Thư viện React.
    - `@tanstack/react-query`: Quản lý state server và data fetching.
    - `axios`: HTTP client để giao tiếp với backend.
    - `stream-chat`, `stream-chat-react`: Tích hợp Stream Chat.
    - `@stream-io/video-react-sdk`: Hỗ trợ chức năng gọi video.
    - `zustand`: Quản lý state toàn cục nhẹ.
    - `react-hot-toast`: Hiển thị thông báo.
    - `lucide-react`: Bộ icon.
  - **DevDependencies chính**:
    - `vite`: Build tool hiệu suất cao.
    - `tailwindcss`, `postcss`, `autoprefixer`: CSS utilities.
    - `daisyui`: Component library cho TailwindCSS.
    - `eslint`: Kiểm tra code quality.

- **vite.config.js**: Cấu hình Vite cho dự án.
- **tailwind.config.js**: Cấu hình TailwindCSS và DaisyUI.
- **postcss.config.js**: Cấu hình PostCSS để xử lý CSS.
- **eslint.config.js**: Cấu hình ESLint cho kiểm tra code chất lượng.

## 3. Thứ Tự Nên Học

1. **main.jsx và App.jsx**: Hiểu cách ứng dụng khởi động và cấu trúc route.

2. **lib**:
   - `axios.js`: Cách cấu hình HTTP client
   - `api.js`: Các API endpoint và cách giao tiếp với backend
   - `utils.js`: Các hàm tiện ích

3. **constants**: Nắm vững các giá trị hằng số trong ứng dụng, đặc biệt là themes và languages.

4. **store**: Cách quản lý state toàn cục với Zustand.

5. **hooks**: Cách xử lý logic authentication và các tác vụ chính.
   - `useAuthUser.js`: Truy xuất thông tin người dùng hiện tại
   - `useSignUp.js`, `useLogin.js`, `useLogout.js`: Xử lý các tác vụ xác thực

6. **components**: Hiểu các UI component tái sử dụng.
   - `Layout.jsx`: Bố cục chính
   - `Navbar.jsx`, `Sidebar.jsx`: Điều hướng
   - Các component nhỏ: `FriendCard.jsx`, `ThemeSelector.jsx`, v.v.

7. **pages**: Cách các trang được tổ chức và cách chúng sử dụng các component khác.
   - `SignUpPage.jsx`, `LoginPage.jsx`: Quy trình đăng ký/đăng nhập
   - `OnboardingPage.jsx`: Thiết lập thông tin người dùng
   - `HomePage.jsx`, `ChatPage.jsx`: Tương tác chính của ứng dụng
   - `NotificationsPage.jsx`, `CallPage.jsx`: Chức năng bổ sung

## 4. Luồng Hoạt Động Của Ứng Dụng

1. **Khởi động ứng dụng** -> `main.jsx` và `App.jsx`
   - Khởi tạo React Query, StreamChatProvider và các providers khác
   - Thiết lập routes và phân quyền người dùng

2. **Đăng ký tài khoản** -> `SignUpPage.jsx` và `useSignUp.js`
   - Thu thập thông tin cơ bản (email, password, tên)
   - Gửi request đến backend để tạo tài khoản

3. **Thiết lập thông tin chi tiết** -> `OnboardingPage.jsx`
   - Chọn ngôn ngữ, vị trí và ảnh đại diện
   - Cập nhật thông tin người dùng trên backend

4. **Trang chính và tương tác** -> `HomePage.jsx`
   - Hiển thị danh sách bạn bè (`FriendCard.jsx`)
   - Hiển thị thông báo và cuộc trò chuyện gần đây

5. **Chat với người dùng khác** -> `ChatPage.jsx`
   - Sử dụng Stream Chat SDK để tạo và hiển thị cuộc trò chuyện
   - Gửi tin nhắn, hình ảnh và emoji

6. **Nhận và quản lý thông báo** -> `NotificationsPage.jsx`
   - Xem và phản hồi lời mời kết bạn
   - Quản lý thông báo hệ thống

7. **Gọi video/audio** -> `CallPage.jsx`
   - Sử dụng Stream Video SDK để tạo cuộc gọi
   - Quản lý camera, microphone và các tính năng cuộc gọi

## 5. Tích Hợp Với Backend

Frontend giao tiếp với backend thông qua các API endpoint được định nghĩa trong `lib/api.js`. Các hoạt động chính bao gồm:

- **Authentication**: Đăng ký, đăng nhập, đăng xuất
- **Quản lý người dùng**: Cập nhật thông tin, tìm kiếm người dùng
- **Social**: Gửi lời mời kết bạn, chấp nhận/từ chối lời mời
- **Chat**: Tạo kênh, gửi tin nhắn thông qua Stream Chat SDK
- **Gọi video**: Khởi tạo và tham gia cuộc gọi thông qua Stream Video SDK

Backend cung cấp Stream Chat token và JWT token cho authentication, được xử lý trong `hooks/useAuthUser.js` và các hook liên quan.
