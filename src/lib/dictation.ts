import { useEffect, useRef, useState } from 'react';

// Voice journaling: speech to text with expo-speech-recognition. It needs the app's own build
// (not Expo Go), so the module is loaded defensively and the mic button simply hides when
// speech recognition isn't available.

type SpeechModule = typeof import('expo-speech-recognition')['ExpoSpeechRecognitionModule'];

function loadSpeech(): SpeechModule | null {
  try {
    const speech = (require('expo-speech-recognition') as typeof import('expo-speech-recognition'))
      .ExpoSpeechRecognitionModule;
    return speech.isRecognitionAvailable() ? speech : null;
  } catch {
    return null;
  }
}

const Speech = loadSpeech();

// Only one field dictates at a time; events go to whichever field started it.
let activeOwner: object | null = null;

export function dictationAvailable() {
  return Speech !== null;
}

/**
 * Starts and stops dictation. `onText` gets each finished phrase; `partial` holds what is being
 * heard right now, to show while they speak.
 */
export function useDictation(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const owner = useRef({}).current;
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => {
    if (!Speech) return;
    const subscriptions = [
      Speech.addListener('result', (event) => {
        if (activeOwner !== owner) return;
        const transcript = event.results[0]?.transcript?.trim() ?? '';
        if (event.isFinal) {
          setPartial('');
          if (transcript) onTextRef.current(transcript);
        } else {
          setPartial(transcript);
        }
      }),
      Speech.addListener('end', () => {
        if (activeOwner !== owner) return;
        activeOwner = null;
        setListening(false);
        setPartial('');
      }),
      Speech.addListener('error', (event) => {
        if (activeOwner !== owner) return;
        activeOwner = null;
        setListening(false);
        // "no-speech" and "aborted" just mean they stopped or said nothing.
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError("Couldn't hear that. Check the microphone permission and try again.");
        }
      }),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      if (activeOwner === owner) {
        activeOwner = null;
        Speech.abort();
      }
    };
  }, [owner]);

  async function start() {
    if (!Speech) return;
    setError(null);
    const permission = await Speech.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Allow microphone access in your phone settings to speak your notes.');
      return;
    }
    if (activeOwner) Speech.abort();
    activeOwner = owner;
    Speech.start({ lang: 'en-US', interimResults: true, continuous: true, addsPunctuation: true });
    setListening(true);
  }

  function stop() {
    Speech?.stop();
  }

  return { available: Speech !== null, listening, partial, error, start, stop };
}

/** Adds a spoken phrase to existing text with a space, capitalising the start of the phrase. */
export function appendSpoken(existing: string, spoken: string): string {
  const phrase = spoken.charAt(0).toUpperCase() + spoken.slice(1);
  if (!existing.trim()) return phrase;
  return `${existing.replace(/\s+$/, '')} ${phrase}`;
}
