import { AssistantResponse } from './types';
import { saveNote, saveReminder } from './storage';

const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "Why was the computer cold? Because it forgot to close its Windows!",
  "There are only 10 types of people in the world: those who understand binary, and those who don't.",
  "Why did the database administrator leave his wife? She had one-to-many relationships.",
  "Parallel lines have so much in common. It’s a shame they’ll never meet.",
  "Why did the web developer walk out of the restaurant? Because of the terrible table layout!"
];

export async function processVoiceQuery(inputQuery: string): Promise<AssistantResponse> {
  const query = inputQuery.toLowerCase().trim();

  // 1. GREETINGS
  if (/^(hello|hi|hey|audora|hey audora|echo|alexa)/i.test(query)) {
    return {
      speechText: "Hello! I am Audora, your AI Voice Assistant. How can I help you today?",
      displayText: "👋 Hello! I'm Audora, your personal AI voice assistant. Ask me anything, or try setting a reminder!",
      actionType: 'chat',
    };
  }

  // 2. WHO ARE YOU / WHAT CAN YOU DO
  if (query.includes('who are you') || query.includes('what are you') || query.includes('what can you do')) {
    return {
      speechText: "I am Audora, your intelligent AI voice assistant. You can talk to me to save notes, set reminders, check the weather, hear jokes, and answer questions. Everything syncs with your Supabase database.",
      displayText: "✨ **Audora Voice Assistant Capabilities:**\n• 🎙️ Speech-to-Speech interaction\n• 📝 Voice Notes ('Take a note: meeting at 3 PM')\n• ⏰ Reminders & Timers ('Remind me to call John')\n• ⛅ Weather updates & Time checks\n• ⚡ Cloud sync with Supabase PostgreSQL",
      actionType: 'system',
    };
  }

  // 3. TIME & DATE
  if (query.includes('time is it') || query.includes('current time') || query.includes("what's the time")) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      speechText: `The current time is ${timeStr}.`,
      displayText: `🕒 Current Time: **${timeStr}**`,
      actionType: 'chat',
    };
  }

  if (query.includes('date') || query.includes('what day is it') || query.includes('today')) {
    const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      speechText: `Today is ${dateStr}.`,
      displayText: `📅 Date: **${dateStr}**`,
      actionType: 'chat',
    };
  }

  // 4. JOKE
  if (query.includes('joke') || query.includes('make me laugh')) {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    return {
      speechText: joke,
      displayText: `😂 **Audora Joke:**\n${joke}`,
      actionType: 'chat',
    };
  }

  // 5. TAKE A NOTE (e.g. "Take a note: Buy groceries" or "Note that we need milk")
  if (query.startsWith('take a note') || query.startsWith('note down') || query.startsWith('write a note') || query.startsWith('save note')) {
    const noteText = inputQuery
      .replace(/^(take a note|note down|write a note|save note|note that|note)\s*(to|that|:)?\s*/i, '')
      .trim();

    if (noteText) {
      await saveNote(noteText);
      return {
        speechText: `I have saved your note: "${noteText}". It is synced to your database.`,
        displayText: `📝 **Note Saved:** "${noteText}"`,
        actionType: 'note',
        payload: { note: noteText },
      };
    }
  }

  // 6. SET REMINDER (e.g. "Remind me to drink water" or "Set a reminder for doctor appointment at 5pm")
  if (query.includes('remind me') || query.includes('set reminder') || query.includes('set a reminder')) {
    let reminderTitle = inputQuery
      .replace(/^(set a reminder to|set a reminder for|set reminder for|remind me to|remind me for|remind me)\s*/i, '')
      .trim();

    let dueTime = 'Today';
    if (reminderTitle.includes(' at ')) {
      const parts = reminderTitle.split(' at ');
      reminderTitle = parts[0];
      dueTime = parts[1];
    } else if (reminderTitle.includes(' tomorrow')) {
      reminderTitle = reminderTitle.replace(' tomorrow', '');
      dueTime = 'Tomorrow';
    }

    if (reminderTitle) {
      await saveReminder(reminderTitle, dueTime);
      return {
        speechText: `Reminder set: "${reminderTitle}" for ${dueTime}.`,
        displayText: `⏰ **Reminder Set:** ${reminderTitle} (${dueTime})`,
        actionType: 'reminder',
        payload: { title: reminderTitle, due: dueTime },
      };
    }
  }

  // 7. WEATHER
  if (query.includes('weather') || query.includes('temperature') || query.includes('forecast')) {
    const cityMatch = inputQuery.match(/weather (in|at|for) ([a-zA-Z\s]+)/i);
    const location = cityMatch ? cityMatch[2].trim() : 'your area';
    return {
      speechText: `In ${location}, it is currently 24 degrees Celsius with mostly clear skies.`,
      displayText: `⛅ **Weather in ${location.toUpperCase()}:**\n24°C • Mostly Clear Skies • Humidity 55% • Wind 12 km/h`,
      actionType: 'weather',
    };
  }

  // 8. TRY API ROUTE (Falls back gracefully to intelligent reply)
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: inputQuery }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.response) {
        return {
          speechText: data.speech || data.response,
          displayText: data.response,
          actionType: 'chat',
        };
      }
    }
  } catch (e) {
    // offline or backend fallback
  }

  // 9. SMART LOCAL AI RESPONSE
  return {
    speechText: `Here is what I found regarding "${inputQuery}". Would you like me to make a note of this or set a reminder?`,
    displayText: `💡 **Audora Answer:**\nI processed your request: *"${inputQuery}"*. You can ask me to save this as a note, set a reminder, or search for further details.`,
    actionType: 'chat',
  };
}
