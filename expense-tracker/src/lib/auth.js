import { ref } from 'vue'
import { supabase } from './supabase'

export const currentUser = ref(null)

export async function initAuth() {
  const { data } = await supabase.auth.getSession()
  currentUser.value = data.session?.user || null

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser.value = session?.user || null
  })
}
