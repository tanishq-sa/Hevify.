/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base colors
        background: {
          DEFAULT: '#FFFFFF',      
          dark: '#0A0A0A',         
        },
        foreground: {
          DEFAULT: '#11181C',     
          dark: '#F5F5F5',         // Dark: Light gray text
        },
        
        // Surface/Card colors
        card: {
          DEFAULT: '#f2f2f2',      // Light: White cards
          dark: '#2A2A2A',         // Dark: Dark gray cards
        },
        'card-secondary': {
          DEFAULT: '#F8F9FA',      // Light: Light gray
          dark: '#252525',         // Dark: Medium gray
        },
        
        // Muted/Secondary colors
        muted: {
          DEFAULT: '#f2f2f2',      // Light: Very light gray
          dark: '#2A2A2A',         // Dark: Dark gray
        },
        'muted-foreground': {
          DEFAULT: '#64748B',      // Light: Medium gray text
          dark: '#94A3B8',         // Dark: Light gray text
        },
        
        // Border colors
        border: {
          DEFAULT: '#E2E8F0',      // Light: Light gray border
          dark: '#333333',         // Dark: Dark gray border
        },
        'border-subtle': {
          DEFAULT: '#F1F5F9',      // Light: Very subtle border
          dark: '#2A2A2A',         // Dark: Subtle dark border
        },
        
        // Primary/Accent colors
        primary: {
          DEFAULT: '#3B82F6',      // Light: Blue
          dark: '#60A5FA',         // Dark: Lighter blue
        },
        'primary-foreground': {
          DEFAULT: '#FFFFFF',      // Light: White text on primary
          dark: '#0A0A0A',         // Dark: Dark text on primary
        },
        
        // Secondary colors
        secondary: {
          DEFAULT: '#F1F5F9',      // Light: Light gray
          dark: '#1E293B',         // Dark: Dark blue-gray
        },
        'secondary-foreground': {
          DEFAULT: '#0F172A',      // Light: Dark text
          dark: '#F1F5F9',         // Dark: Light text
        },
        
        // Accent colors for workout app
        accent: {
          DEFAULT: '#10B981',      // Light: Green (success/start)
          dark: '#34D399',         // Dark: Lighter green
        },
        'accent-foreground': {
          DEFAULT: '#FFFFFF',      // Light: White text
          dark: '#064E3B',         // Dark: Dark green text
        },
        
        // Destructive/Error colors
        destructive: {
          DEFAULT: '#EF4444',      // Light: Red
          dark: '#F87171',         // Dark: Lighter red
        },
        'destructive-foreground': {
          DEFAULT: '#FFFFFF',      // Light: White text
          dark: '#7F1D1D',         // Dark: Dark red text
        },
        
        // Warning colors
        warning: {
          DEFAULT: '#F59E0B',      // Light: Amber
          dark: '#FBBF24',         // Dark: Lighter amber
        },
        
        // Success colors
        success: {
          DEFAULT: '#10B981',      // Light: Green
          dark: '#34D399',         // Dark: Lighter green
        },
        
        // Workout-specific colors
        'workout-primary': {
          DEFAULT: '#3B82F6',      // Light: Blue for primary actions
          dark: '#60A5FA',         // Dark: Lighter blue
        },
        'workout-pro': {
          DEFAULT: '#FCD34D',      // Light: Yellow for PRO badge
          dark: '#FDE047',         // Dark: Lighter yellow
        },
        'workout-pro-foreground': {
          DEFAULT: '#78350F',      // Light: Dark brown text on yellow
          dark: '#78350F',         // Dark: Same dark text
        },
      },
    },
  },
  plugins: [],
}