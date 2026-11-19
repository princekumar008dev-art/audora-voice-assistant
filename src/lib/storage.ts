import { supabase, isSupabaseConfigured } from './supabase';
import { ConversationItem, VoiceNote, ReminderItem } from './types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'echo_conversations',
  NOTES: 'echo_notes',
  REMINDERS: 'echo_reminders',
};

// --- Conversations ---
export async function getConversations(): Promise<ConversationItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('echo_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!error && data) return data as ConversationItem[];
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local storage', e);
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return raw ? JSON.parse(raw) : [];
  }
  return [];
}

export async function saveConversation(
  prompt: string, 
  response: string, 
  action_type: 'chat' | 'note' | 'reminder' | 'weather' | 'media' | 'system' = 'chat'
): Promise<ConversationItem> {
  const item: ConversationItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conv-${Date.now()}`,
    prompt,
    response,
    action_type,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('echo_conversations')
        .insert([{
          prompt: item.prompt,
          response: item.response,
          action_type: item.action_type,
        }])
        .select()
        .single();
      if (!error && data) return data as ConversationItem;
    } catch (e) {
      console.error('Failed to save to Supabase', e);
    }
  }

  if (typeof window !== 'undefined') {
    const prev = await getConversations();
    const updated = [item, ...prev].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated));
  }
  return item;
}

// --- Notes ---
export async function getNotes(): Promise<VoiceNote[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('echo_notes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as VoiceNote[];
    } catch (e) {
      console.warn('Supabase fetch failed for notes', e);
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    return raw ? JSON.parse(raw) : [];
  }
  return [];
}

export async function saveNote(content: string, title?: string): Promise<VoiceNote> {
  const item: VoiceNote = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}`,
    title: title || `Note on ${new Date().toLocaleDateString()}`,
    content,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('echo_notes')
        .insert([{
          title: item.title,
          content: item.content,
        }])
        .select()
        .single();
      if (!error && data) return data as VoiceNote;
    } catch (e) {
      console.error('Failed to save note to Supabase', e);
    }
  }

  if (typeof window !== 'undefined') {
    const prev = await getNotes();
    const updated = [item, ...prev];
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
  }
  return item;
}

export async function deleteNote(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('echo_notes').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to delete note from Supabase', e);
    }
  }
  if (typeof window !== 'undefined') {
    const prev = await getNotes();
    const updated = prev.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updated));
  }
}

// --- Reminders ---
export async function getReminders(): Promise<ReminderItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('echo_reminders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as ReminderItem[];
    } catch (e) {
      console.warn('Supabase fetch failed for reminders', e);
    }
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    return raw ? JSON.parse(raw) : [];
  }
  return [];
}

export async function saveReminder(title: string, due_time?: string): Promise<ReminderItem> {
  const item: ReminderItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rem-${Date.now()}`,
    title,
    due_time: due_time || 'Today',
    is_completed: false,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('echo_reminders')
        .insert([{
          title: item.title,
          due_time: item.due_time,
          is_completed: false,
        }])
        .select()
        .single();
      if (!error && data) return data as ReminderItem;
    } catch (e) {
      console.error('Failed to save reminder to Supabase', e);
    }
  }

  if (typeof window !== 'undefined') {
    const prev = await getReminders();
    const updated = [item, ...prev];
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  }
  return item;
}

export async function toggleReminder(id: string, is_completed: boolean): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('echo_reminders').update({ is_completed }).eq('id', id);
    } catch (e) {
      console.error('Failed to update reminder in Supabase', e);
    }
  }
  if (typeof window !== 'undefined') {
    const prev = await getReminders();
    const updated = prev.map(r => r.id === id ? { ...r, is_completed } : r);
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  }
}

export async function deleteReminder(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('echo_reminders').delete().eq('id', id);
    } catch (e) {
      console.error('Failed to delete reminder from Supabase', e);
    }
  }
  if (typeof window !== 'undefined') {
    const prev = await getReminders();
    const updated = prev.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  }
}
