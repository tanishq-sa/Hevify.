# Firestore Database Schema

## Collections

### 1. `users` Collection
**Document ID**: User UID (from Firebase Auth)

```typescript
{
  username: string,
  email: string,
  createdAt: string (ISO timestamp),
  updatedAt: string (ISO timestamp),
  avatar?: string (URL),
  bio?: string,
  stats?: {
    totalWorkouts: number,
    totalVolume: number,
    totalSets: number,
    records: number
  }
}
```

### 2. `workouts` Collection
**Document ID**: Auto-generated

```typescript
{
  userId: string (user UID),
  username: string,            // denormalized for faster feed rendering
  avatar?: string,             // denormalized avatar URL used in feed
  title: string,
  description?: string,
  duration: number (seconds),
  exercises: Array<{
    id: string,
    name: string,
    primaryMuscle: string,
    secondaryMuscles: string[],
    notes?: string,
    restTimer: number (seconds),
    sets: Array<{
      id: string,
      weight: number,
      reps: number,
      rpe?: number,
      completed: boolean,
      setType?: 'W' | '1' | 'F' | 'D', // W=Warm Up, 1=Normal, F=Failure, D=Drop Set
      duration?: number (seconds for time-based exercises)
    }>
  }>,
  volume: number (total kg),
  sets: number (total completed sets),
  visibility: 'Everyone' | 'Only me',
  likes?: string[],            // list of userIds who liked this workout
  comments?: Array<{
    id: string,
    userId: string,
    username: string,
    avatar?: string,
    text: string,
    createdAt: string
  }>,
  createdAt: string (ISO timestamp),
  updatedAt?: string (ISO timestamp)
}
```

### 3. `workouts` Subcollection: `current_${userId}` (for active workouts)
**Document ID**: `current_${userId}`

```typescript
{
  exercises: Array<WorkoutExercise>,
  duration: number (seconds),
  userId: string,
  updatedAt: string (ISO timestamp)
}
```

### 4. `exercises` Collection (Optional - for exercise library)
**Document ID**: Exercise ID

```typescript
{
  name: string,
  primaryMuscle: string,
  secondaryMuscles: string[],
  equipment?: string[],
  instructions?: string[],
  imageUrl?: string,
  createdAt: string (ISO timestamp)
}
```

### 5. `routines` Collection (Optional - for workout templates)
**Document ID**: Auto-generated

```typescript
{
  userId: string,
  name: string,
  description?: string,
  exercises: Array<{
    exerciseId: string,
    name: string,
    sets: number,
    reps?: number,
    weight?: number,
    restTimer: number
  }>,
  createdAt: string (ISO timestamp),
  updatedAt: string (ISO timestamp)
}
```

## Indexes Required

### Composite Indexes (create in Firebase Console):

1. **workouts collection (user feed)**:
   - Fields: `userId` (Ascending), `createdAt` (Descending)
   - Query: Get a user's workouts ordered by date
2. **workouts collection (public feed)**:
   - Fields: `visibility` (Ascending), `createdAt` (Descending)
   - Query: Get `visibility == 'Everyone'` ordered by date for the home feed

## Security Rules (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Workouts collection
    match /workouts/{workoutId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.visibility == 'Everyone'
      );
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Current workout (active workout)
    match /workouts/current_{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Exercises collection (public read, admin write)
    match /exercises/{exerciseId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write (configure separately)
    }
    
    // Routines collection
    match /routines/{routineId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        resource.data.visibility == 'Everyone'
      );
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

