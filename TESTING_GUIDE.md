# How to Self-Test "Midnight Music Duel"

Since this is a real-time multiplayer game, you need two "clients" to play. Here is the best way to test it by yourself.

## Option 1: Hybrid (Easiest) - Emulator + Web
You can play against yourself using the Android Emulator and a Web Browser.

1.  **Start the Server**:
    Run `npx expo start` in your terminal.

2.  **Player 1 (Host) - Android Emulator**:
    - Press `a` in the terminal to open on Android.
    - Tap **HOST GAME**.
    - Enter an artist (e.g., "Drake") and tap **Create Room**.
    - **Note the 6-character Room Code** displayed on the lobby screen.

3.  **Player 2 (Guest) - Web Browser**:
    - Press `w` in the terminal to open in your default browser.
    - Use the simulated phone view in Chrome DevTools (F12 -> Toggle Device Toolbar) for the best UI experience.
    - Tap **JOIN GAME**.
    - Enter the Room Code from the Android Emulator.
    - Tap **Join Room**.

4.  **The Loop**:
    - **Lobby**: You should see "Player 2 Joined!" on the Android Emulator.
    - **Start**: Tap **START GAME** on the Emulator. Both screens should transition to the Game screen.
    - **Sync Test**:
        - Make a guess on the Web Browser. Android should show "Waiting for opponent...".
        - Make a guess on Android. Both screens should reveal the result instantly.

## Option 2: Two Browser Tabs
If you don't have an emulator running, you can just use two browser windows.

1.  Run `npx expo start`.
2.  Press `w` to open in browser.
3.  Open a **second tab** (or Incognito window) to `http://localhost:8081`.
4.  Set up Host in Tab A and Join in Tab B.

## Option 3: Two Emulators (Advanced)
If you want to test native-to-native sync:
- Launch two different Android Virtual Devices (AVDs) via Android Studio.
- Run the app on both (Expo Go usually handles this if both are open).

> [!NOTE]
> **Audio on Web**: The `expo-av` audio playback might behave slightly differently on Web (browsers sometimes block auto-play). If music doesn't start automatically on the web client, interact with the page (click anywhere) to enable audio.
