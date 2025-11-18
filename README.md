# Hevify 💪

A modern workout tracking and social fitness app built with React Native and Expo. Track your workouts, create routines, share your progress, and connect with other athletes.

## Features

### Workout Tracking
- **Log Workouts**: Track exercises, sets, reps, and weights in real-time
- **Routine Management**: Create, edit, and manage workout routines
- **Rest Timer**: Built-in rest timer with customizable intervals
- **Exercise History**: View your workout history for each exercise
- **Exercise Details**: Access step-by-step instructions and tips for exercises

### Social Features
- **Workout Feed**: Browse public workouts from the community
- **Like & Comment**: Engage with other athletes' workouts
- **Share Workouts**: Share your routines and workouts with others
- **User Profiles**: View profiles and statistics of other athletes
- **Suggested Athletes**: Discover and follow other users

### User Experience
- **Native Navigation**: Liquid glass navigation bar using NativeTabs
- **Dark Mode**: Automatic dark/light mode support
- **Loading States**: Smooth loading indicators throughout the app
- **Haptic Feedback**: Enhanced user interactions with haptic feedback
- **iOS Share Sheet**: Native iOS sharing integration

## Tech Stack

- **Framework**: React Native 0.81.5 with Expo ~54.0.23
- **Navigation**: Expo Router 6.0.14 with NativeTabs
- **Styling**: NativeWind 4.2.1 (Tailwind CSS for React Native)
- **Backend**: Firebase (Firestore, Authentication)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Storage**: AsyncStorage for local data, Firestore for cloud sync
- **Icons**: Lucide React Native, SF Symbols (iOS)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Firebase project with Firestore enabled

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd appathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (if developing for iOS)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Configure Firebase**
   - Add your `GoogleService-Info.plist` to `ios/HevyClone/`
   - Add your `google-services.json` to `android/app/`
   - Update Firebase configuration in `config/firebase.ts`

## Running the App

### Development Build

For the best experience, use a development build:

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Expo Go (Limited)

For quick testing (with limitations):

```bash
npx expo start
```

Then scan the QR code with Expo Go app on your device.

## Project Structure

```
appathon/
├── app/                    # App screens (Expo Router file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home feed
│   │   ├── workout.tsx    # Routines management
│   │   └── profile.tsx    # User profile
│   ├── log-workout.tsx    # Workout logging screen
│   ├── workout-detail.tsx # Workout details view
│   ├── exercise-detail.tsx # Exercise information
│   ├── new-routine.tsx    # Create routine
│   ├── edit-routine.tsx    # Edit routine
│   └── ...
├── components/            # Reusable components
│   └── workout-overlay.tsx
├── config/               # Configuration files
│   └── firebase.ts       # Firebase setup
├── utils/                # Utility functions
│   ├── workout-storage.ts
│   ├── routine-storage.ts
│   ├── workout-interactions.ts
│   └── ...
├── constants/            # App constants
└── hooks/               # Custom React hooks
```

## Key Features Implementation

### Workout Logging
- Real-time set tracking with weight and rep inputs
- Routine-based workout initialization
- Previous set values displayed in gray
- Rest timer with exercise-specific tracking
- Discard workout functionality

### Routine Management
- Create routines with exercises, sets, and rep ranges
- Edit existing routines
- Share routines via native share sheet
- Delete routines with confirmation

### Social Feed
- Public workout feed with likes and comments
- User profile navigation
- Suggested athletes section
- Loading states for better UX

### Exercise Details
- Workout history for each exercise
- Step-by-step instructions
- Exercise sharing functionality

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password and Google OAuth)
4. Create the following Firestore indexes:
   - Collection: `workouts`
     - Fields: `visibility` (Ascending), `createdAt` (Descending)
   - Collection: `workouts`
     - Fields: `userId` (Ascending), `createdAt` (Descending)
     - Fields: `exercises.name` (Ascending), `createdAt` (Descending)

## Development

### Available Scripts

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web

# Lint code
npm run lint
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- NativeWind (Tailwind CSS) for styling
- Functional components with React Hooks

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Troubleshooting

### Development Build Not Installed

If you see "No development build installed", run:
```bash
npx expo run:ios
# or
npx expo run:android
```

### CocoaPods Issues (iOS)

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Firebase Index Errors

If you see Firestore index errors, create the required indexes in Firebase Console:
- Go to Firestore > Indexes
- Create composite indexes as listed in the Firebase Setup section

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Version

Current version: **2.0.0**

## Support

For issues and questions, please open an issue in the repository.

---

Built with ❤️ using Expo and React Native
