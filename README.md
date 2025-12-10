# 🎵 1V1 Music Duel

A real-time multiplayer music guessing game built with React Native and Expo. Challenge your friends to guess songs from your favorite artists!

![React Native](https://img.shields.io/badge/React%20Native-0.81-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-orange?logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **Real-time Multiplayer** - Host or join games with friends using a simple 6-character room code
- **Artist Search** - Search any artist using the iTunes API
- **Live Audio Playback** - Stream 30-second song previews directly in the app
- **Synchronized Gameplay** - Both players hear the same song at the same time
- **Score Tracking** - First to guess correctly wins the round
- **Beautiful UI** - Sleek dark theme with neon accents and glass-morphism effects

## 🎮 How to Play

1. **Host a Game**: Search for an artist and create a room
2. **Share the Code**: Give your friend the 6-character room code
3. **Join**: Your friend enters the code to join
4. **Listen & Guess**: A song plays - first to identify it wins!
5. **Compete**: Play through multiple rounds to crown the champion

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Anonymous Auth
- **Audio**: Expo AV
- **Music Data**: iTunes Search API
- **Animations**: React Native Reanimated
- **Styling**: Custom design system with glass-morphism

## 📱 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/VICHiNG16/MusicDuel.git
cd MusicDuel

# Install dependencies
npm install

# Start the development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

### Building for Production

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build Release APK
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## 📁 Project Structure

```
MusicDuel/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with auth
│   ├── index.tsx           # Home screen
│   ├── lobby/[id].tsx      # Game lobby
│   └── game/[id].tsx       # Gameplay screen
├── components/             # Reusable UI components
│   ├── BackgroundGradient.tsx
│   ├── GlassButton.tsx
│   └── SongCard.tsx
├── constants/
│   └── Colors.ts           # Design system colors
├── utils/
│   ├── firebaseConfig.ts   # Firebase setup
│   ├── itunes.ts           # iTunes API client
│   └── gameSync.ts         # Multiplayer sync logic
└── assets/                 # Images and fonts
```

## 🔥 Firebase Setup

This project uses Firebase for real-time multiplayer functionality. To use your own Firebase project:

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Anonymous Authentication**
3. Create a **Realtime Database**
4. Copy your config to `utils/firebaseConfig.ts`

## 🎨 Design

The app features a "Midnight Luxury" design language:

- **Dark Background**: `#0a0e17`
- **Primary Accent**: Neon Cyan `#00f3ff`
- **Secondary Accent**: Neon Magenta `#ff00ff`
- **Glass Effects**: Semi-transparent surfaces with blur
- **Typography**: Outfit (display) + Inter (body)

## 📄 License

MIT License - feel free to use this project for learning or as a starting point for your own apps!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Made with ❤️ and 🎵
