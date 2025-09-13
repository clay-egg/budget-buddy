import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
// Import the updated User type from database.ts
import type { User as SupabaseUserType } from '../types/database'

// Define a more specific type for the user object we'll manage in context
// This ensures our context user object matches our desired structure
interface AuthUser extends SupabaseUserType {
  // We extend SupabaseUserType and ensure 'name' is handled, 
  // even if it comes from user_metadata which might be any type initially.
  // For stricter typing, we might cast or re-assert 'name' type here if needed.
}

interface AuthContextType {
  user: AuthUser | null
  // Add 'name' parameter to signUp
  signUp: (email: string, password: string, name: string) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper function to extract relevant user data, including name from metadata
  const extractUserData = (supabaseUser: any): AuthUser | null => {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      // Extract name from user_metadata. If it's not there or null, it will be null.
      name: supabaseUser.user_metadata?.name || null, 
    };
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(extractUserData(session?.user))
      setLoading(false)
    }

    getSession()

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(extractUserData(session?.user))
        setLoading(false)
      }
    )

    // Cleanup subscription on component unmount
    return () => subscription?.unsubscribe()
  }, [])

  // Modified signUp function to accept 'name' and update user metadata
  const signUp = async (email: string, password: string, name: string) => {
    // First, sign up the user with their name in the options
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          email: email
        }
      }
    });

    if (error) {
      console.error("Supabase signUp error:", error);
      return { data, error };
    }

    // If signup was successful and a user object is returned
    if (data.user) {
      try {
        // Update the user's metadata with the provided name
        const { data: updatedUserSession, error: updateError } = await supabase.auth.updateUser({
          data: { 
            name: name,
            email: email
          }
        });

        if (updateError) {
          console.error("Error updating user metadata after signup:", updateError);
          // We'll still proceed since the initial signup was successful
        } else {
          // If metadata update succeeded, update the user state in the context
          setUser(extractUserData(updatedUserSession?.user));
        }
      } catch (updateException) {
        console.error("Exception during user metadata update:", updateException);
      }
    }
    
    return { data, error };
  }

  // Modified signIn to ensure user metadata is extracted and set in context
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // If signin was successful and a session is returned, update the user state
    if (!error && data.session) {
        setUser(extractUserData(data.session.user));
    }
    return { data, error };
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null) // Clear user state on sign out
  }

  // Value provided by the context
  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}