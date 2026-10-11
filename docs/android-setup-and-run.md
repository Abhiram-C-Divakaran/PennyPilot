# PennyPilot Android Client (Phase 3B) — Setup & Run Guide

## Overview

The PennyPilot Android client (`com.pennypilot.app`) runs as a lightweight, background-capable notification listener service. It detects financial notifications from supported UPI and banking apps (Google Pay, PhonePe, Paytm, BHIM, CRED, Amazon Pay), parses transaction information locally, and sends normalized `IncomingTransaction` JSON payloads to the PennyPilot backend ingestion pipeline.

---

## 1. Running the PennyPilot Web/Backend Server

Start the development backend server from the project root:

```bash
cd GoalSave
npm run dev
```

The server listens on `http://localhost:3000` (or the configured port).

Verify the health check endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "PennyPilot",
  "version": "1.0.0"
}
```

---

## 2. Running the Android Application

### Option A: Via Command Line (Gradle)

Navigate to the `android/` directory:

```bash
cd android
.\gradlew.bat test
.\gradlew.bat assembleDebug
```

To install on an attached device or running emulator:

```bash
.\gradlew.bat installDebug
```

### Option B: Via Android Studio

1. Open Android Studio.
2. Select **Open** and choose the `android` folder (`GoalSave/android`).
3. Allow Gradle to sync.
4. Select your target device (Emulator or Physical Device) and click **Run (Shift+F10)**.

---

## 3. Server URL Configuration

Open the Android app and navigate to **Settings**:

### For Android Emulator
- Set Base URL to:
  ```text
  http://10.0.2.2:3000
  ```
  *(Android Emulator uses `10.0.2.2` as an alias for the host computer's `127.0.0.1`)*.

### For Physical Android Device
- Ensure your phone and development PC are connected to the same Wi-Fi network.
- Determine your computer's local IP address (`ipconfig` on Windows or `ifconfig` on macOS/Linux, e.g., `192.168.1.45`).
- Set Base URL to:
  ```text
  http://192.168.x.x:3000
  ```

Tap **Test Connection** to confirm connectivity. The app will ping `/api/health` and display `✓ Connected to PennyPilot (v1.0.0)`.

---

## 4. Enabling Notification Access

1. On first launch, the Home screen will display a warning banner: **Notification Access: Action Needed**.
2. Tap **Enable Notification Access**.
3. Android's **Device & App Notifications** settings screen will open.
4. Locate **PennyPilot** and grant access.
5. Return to PennyPilot. The status will immediately update to `✓ Enabled`.

> **Privacy Note**: PennyPilot processes notifications strictly locally on your device. Only recognized financial transaction data (amount, counterparty, and payment rail) is forwarded to your self-hosted PennyPilot server. No SMS permissions or accessibility services are used.

---

## 5. Developer Notification Simulator

To test parsing and ingestion end-to-end without spending real money:

1. Tap **Test Notification Simulator** on the Home screen.
2. Select one of the presets (Google Pay, PhonePe, Paytm) or enter custom notification text.
3. Observe live parsed values (Amount, Direction, Merchant, Payment Rail, External Ref, Confidence).
4. Tap **Send to PennyPilot Ingestion API** to simulate real-time ingestion.
5. Check your web PennyPilot transactions list or Review Inbox to see the ingested transaction.
