

# WhatsZak - Family Chat App

## Phase 1: Foundation & Auth
- Set up Supabase Cloud connection (Auth, Database, Realtime, Storage)
- Create database schema: `users` (profiles), `chats`, `chat_participants`, `messages` tables with RLS policies
- User roles table for future admin features
- Email signup/login with name, email, password
- Email confirmation via magic link
- Password reset flow
- Profile page (name, avatar upload to Supabase Storage)

## Phase 2: Chat Interface (Mobile-First)
- WhatsApp-style UI with green theme
- Splash screen with WhatsZak branding
- Conversations list screen with last message preview, timestamps, unread count
- Chat screen with message bubbles (sent/received styling)
- Auto-scroll to latest message
- Online/offline status indicators via Supabase Realtime Presence
- "Typing..." indicator
- Contact/user search to start new chats

## Phase 3: Messaging Features
- Real-time text messaging via Supabase Realtime
- Emoji picker integration
- Image messages with upload to Supabase Storage and preview
- Audio recording in browser (MediaRecorder API) with upload
- Video message upload with preview
- Message types: text, emoji, image, audio, video
- Read receipts (single check = sent, double check = delivered/read)
- Group chat creation and management

## Phase 4: End-to-End Encryption
- Generate public/private key pairs using Web Crypto API on each device
- Store public keys in the `users` table
- Private keys stored securely in browser (IndexedDB)
- Encrypt messages client-side before sending to Supabase
- Decrypt messages client-side on receipt
- Messages stored as encrypted content in database - Supabase cannot read them
- Key exchange for group chats

## Phase 5: Video Calls (WebRTC P2P)
- WebRTC peer-to-peer video/audio calls
- Supabase Realtime for signaling (offer/answer/ICE candidates)
- Free Google STUN servers for NAT traversal
- Call UI: incoming call screen, active call with video, mute/camera toggle, end call
- Note: May not work behind strict firewalls (acceptable for family use)

## Phase 6: Push Notifications (FCM)
- Firebase Cloud Messaging integration (free tier)
- Service Worker for background notifications
- Supabase Edge Function to send push notifications on new messages
- Notification when app is closed/background
- User will need to set up a Firebase project and provide FCM credentials

## Phase 7: Capacitor & APK Setup
- Configure Capacitor for Android
- Camera, microphone, notification, and storage permissions
- Instructions for building APK via Android Studio
- Hot-reload setup for development

## Design Style
- WhatsApp-inspired green color scheme
- Mobile-first responsive layout
- Clean chat bubbles with timestamps
- Bottom navigation bar (Chats, Calls, Profile)
- Smooth animations and transitions

