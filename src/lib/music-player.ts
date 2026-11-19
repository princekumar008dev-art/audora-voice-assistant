export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  genre: string;
  duration?: string;
}

export const AUDORA_PLAYLIST: Track[] = [
  {
    id: 'lofi-1',
    title: 'Lofi Study & Midnight Chill',
    artist: 'Audora Chillhop',
    genre: 'Lofi / Downtempo',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    duration: '2:40',
  },
  {
    id: 'piano-1',
    title: 'Electro Piano Melody',
    artist: 'SoundHelix Acoustic',
    genre: 'Piano Chill',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '6:12',
  },
  {
    id: 'groove-2',
    title: 'Sunset Groove & Synth Beats',
    artist: 'Audora Sessions',
    genre: 'Electronic Beats',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '7:05',
  },
  {
    id: 'ambient-3',
    title: 'Midnight Synth Odyssey',
    artist: 'Cyber Dreamer',
    genre: 'Synthwave Ambient',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: '5:48',
  },
];
