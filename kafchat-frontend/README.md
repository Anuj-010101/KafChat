# Kafchat — Frontend

Real-time messaging client built with React (Vite) + Tailwind CSS, wired to the
Kafchat Express/Socket.io backend.

## Setup

```bash
npm install
cp .env.example .env   # then point VITE_API_URL / VITE_SOCKET_URL at your backend
npm run dev
```

Runs on `http://localhost:3000` by default.

## Folder structure

```
src/
  components/
    common/     Logo, Avatar, Button, Input, Spinner
    auth/       PhoneLoginForm, OtpVerifyForm, RegisterForm
    layout/     Header, Sidebar, ProtectedRoute
    chat/       ChatList, ChatListItem, UserSearch, ChatWindow, MessageBubble,
                MessageInput, TypingIndicator
  context/      AuthContext, ChatContext (global state + socket listeners)
  hooks/        useAuth, useChat, useTypingIndicator
  pages/        AuthPage, DashboardPage, NotFoundPage
  services/     api (axios + JWT interceptor), authService, chatService,
                messageService, userService, socket (socket.io-client)
  utils/        formatTime, constants
```

## Notes

- The sidebar's user search calls `GET /api/users?search=`. Make sure the
  backend has `usersController.js` + `userRoutes.js` mounted at `/api/users`
  (provided alongside this build).
- Socket auth: the client connects with `io(url, { auth: { token } })`,
  matching the `socketAuthMiddleware` in the backend's `chatSocket.js`.
- Dev-mode OTP: while `NODE_ENV !== "production"` on the backend, `sendOtp`
  returns a `devOtp` field so you can test the flow without a real SMS
  provider — it's surfaced in the OTP screen for convenience.
