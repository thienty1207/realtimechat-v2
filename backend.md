# Chi Tiết Cấu Trúc Thư Mục Backend

Dự án backend của bạn là một ứng dụng chat thời gian thực được xây dựng bằng Node.js, Express và Stream Chat service. Dưới đây là giải thích chi tiết từng thư mục và thứ tự học tập phù hợp.

## 1. Các Thư Mục và File Chính

### 1.1. models
- **Chức năng**: Định nghĩa cấu trúc dữ liệu (schema) cho MongoDB bằng Mongoose.
- **Chi tiết**:
  - `User.js` (74 dòng): Schema người dùng với các trường thông tin cá nhân (email, fullName, password), trạng thái (isOnboarded), ảnh đại diện (profilePic), ngôn ngữ và vị trí. Bao gồm các phương thức để mã hóa mật khẩu và xác thực.
  - `FriendRequest.js` (29 dòng): Schema quản lý lời mời kết bạn giữa người dùng, lưu trữ người gửi, người nhận và trạng thái của lời mời.

### 1.2. controllers
- **Chức năng**: Chứa logic xử lý chi tiết các yêu cầu từ client.
- **Chi tiết**:
  - `auth.controller.js` (154 dòng): 
    - Xử lý đăng ký (signup): Kiểm tra dữ liệu, tạo user mới, tạo user trên Stream và JWT token
    - Xử lý đăng nhập (login): Xác thực email/password, tạo JWT token
    - Xử lý đăng xuất (logout): Xóa cookie JWT
    - Xử lý onboarding: Cập nhật thông tin người dùng chi tiết
    - Sử dụng biến môi trường: JWT_SECRET_KEY, NODE_ENV
  
  - `user.controller.js` (149 dòng):
    - Tìm kiếm người dùng (searchUsers)
    - Tạo và quản lý lời mời kết bạn (sendFriendRequest, acceptFriendRequest, rejectFriendRequest)
    - Quản lý danh sách bạn bè (getFriends, removeFriend)
    - Lấy thông tin người dùng hiện tại (getCurrentUser)
    - Cập nhật thông tin cá nhân (updateProfile)
  
  - `chat.controller.js` (13 dòng):
    - Tạo token Stream Chat cho người dùng (getStreamToken)
    - Sử dụng biến môi trường: JWT_SECRET_KEY (gián tiếp)

### 1.3. middleware
- **Chức năng**: Xử lý request trước khi đến controllers.
- **Chi tiết**:
  - `auth.middleware.js` (32 dòng): 
    - Bảo vệ route (protectRoute): Kiểm tra JWT token từ cookie, xác thực và attach user vào request
    - Sử dụng biến môi trường: JWT_SECRET_KEY

### 1.4. lib
- **Chức năng**: Chứa các module tiện ích và kết nối bên ngoài.
- **Chi tiết**:
  - `db.js` (12 dòng): 
    - Kết nối đến MongoDB với Mongoose
    - Sử dụng biến môi trường: MONGO_URI
  
  - `stream.js` (31 dòng):
    - Khởi tạo Stream Chat client
    - Hàm upsertStreamUser: Tạo/cập nhật người dùng trên Stream Chat
    - Hàm generateStreamToken: Tạo Stream Chat token cho người dùng
    - Sử dụng biến môi trường: STEAM_API_KEY, STEAM_API_SECRET

### 1.5. routes
- **Chức năng**: Định nghĩa các endpoint API và kết nối chúng với controllers tương ứng.
- **Chi tiết**:
  - `auth.route.js` (19 dòng):
    - `/register`: Đăng ký người dùng mới
    - `/login`: Đăng nhập
    - `/logout`: Đăng xuất
    - `/onboard`: Hoàn thiện thông tin chi tiết người dùng
  
  - `user.route.js` (27 dòng):
    - `/search`: Tìm kiếm người dùng
    - `/me`: Lấy thông tin người dùng hiện tại
    - `/friend-requests`: Quản lý lời mời kết bạn
    - `/friends`: Quản lý danh sách bạn bè
    - `/profile`: Cập nhật thông tin cá nhân
  
  - `chat.route.js` (10 dòng):
    - `/token`: Lấy token Stream Chat

### 1.6. server.js (44 dòng)
- **Chức năng**: Khởi tạo ứng dụng, thiết lập middleware và kết nối tất cả các thành phần.
- **Chi tiết**:
  - Cấu hình CORS, cookie-parser, Express JSON
  - Đăng ký các route API
  - Cấu hình phục vụ frontend khi ở chế độ production
  - Khởi động server và kết nối MongoDB
  - Sử dụng biến môi trường: PORT, NODE_ENV

## 2. Biến Môi Trường (.env)
- **PORT** (5001): Cổng chạy server backend
  - Sử dụng trong: `server.js`
- **MONGO_URI**: Connection string kết nối MongoDB
  - Sử dụng trong: `lib/db.js`
- **STEAM_API_KEY**, **STEAM_API_SECRET**: Khóa API của Stream Chat
  - Sử dụng trong: `lib/stream.js`
- **JWT_SECRET_KEY**: Khóa bí mật để ký JWT tokens
  - Sử dụng trong: `controllers/auth.controller.js`, `middleware/auth.middleware.js`
- **NODE_ENV**: Môi trường chạy ứng dụng (production/development)
  - Sử dụng trong: `server.js`, `controllers/auth.controller.js`

## 3. Thứ Tự Nên Học

1. **models**: Hiểu cấu trúc dữ liệu cơ bản trước
   - `User.js`: Schema người dùng, cách mã hóa mật khẩu
   - `FriendRequest.js`: Cấu trúc quản lý lời mời kết bạn

2. **lib**: Hiểu cách kết nối với các dịch vụ bên ngoài
   - `db.js`: Kết nối MongoDB
   - `stream.js`: Tích hợp Stream Chat

3. **middleware**: Hiểu cơ chế xác thực
   - `auth.middleware.js`: Cách bảo vệ route và xác thực người dùng

4. **controllers**: Đi sâu vào logic xử lý chi tiết
   - `auth.controller.js`: Xử lý đăng nhập, đăng ký
   - `user.controller.js`: Quản lý người dùng, kết bạn
   - `chat.controller.js`: Xử lý chat

5. **routes**: Hiểu cách API được định tuyến
   - `auth.route.js`, `user.route.js`, `chat.route.js`: Các endpoint API

6. **server.js**: Tổng hợp hiểu cách các thành phần kết nối với nhau và khởi chạy ứng dụng

## 4. Luồng Hoạt Động Của Ứng Dụng

1. Người dùng đăng ký tài khoản -> `auth.controller.js (signup)`
   - Tạo người dùng trong MongoDB
   - Tạo người dùng trong Stream Chat
   - Tạo JWT token và đặt vào cookie

2. Xác thực người dùng -> `middleware/auth.middleware.js`
   - Kiểm tra JWT token từ cookie
   - Tìm và xác thực người dùng

3. Thiết lập thông tin chi tiết -> `auth.controller.js (onboard)`
   - Cập nhật thông tin chi tiết người dùng
   - Cập nhật thông tin trong Stream Chat

4. Quản lý bạn bè -> `user.controller.js`
   - Gửi/chấp nhận/từ chối lời mời kết bạn
   - Hiển thị và quản lý danh sách bạn bè

5. Chat thời gian thực -> `chat.controller.js`
   - Tạo Stream token cho người dùng
   - Kết nối với Stream Chat service

