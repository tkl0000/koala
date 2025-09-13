import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Leaderboard functions
export const updateLeaderboardScore = async (username, score) => {
  try {
    // First, try to update existing user
    const { data: existingUser, error: selectError } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user', username)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking existing user:', selectError)
      return { success: false, error: selectError }
    }

    if (existingUser) {
      // User exists, update their score
      const { data, error } = await supabase
        .from('leaderboard')
        .update({ score: score })
        .eq('user', username)
        .select()

      if (error) {
        console.error('Error updating user score:', error)
        return { success: false, error }
      }

      console.log('User score updated successfully:', data)
      return { success: true, data }
    } else {
      // User doesn't exist, insert new record
      const { data, error } = await supabase
        .from('leaderboard')
        .insert([{ user: username, score: score }])
        .select()

      if (error) {
        console.error('Error inserting new user:', error)
        return { success: false, error }
      }

      console.log('New user added to leaderboard:', data)
      return { success: true, data }
    }
  } catch (error) {
    console.error('Unexpected error in updateLeaderboardScore:', error)
    return { success: false, error }
  }
}

export const getLeaderboard = async () => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in getLeaderboard:', error)
    return { success: false, error }
  }
}
