import { useState, useEffect, useCallback, useRef } from 'react';

// Minimal local TS types for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition(opts?: { onFinal?: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef(opts?.onFinal);

  useEffect(() => {
    onFinalRef.current = opts?.onFinal;
  }, [opts?.onFinal]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setInterim(interimTranscript);

        if (finalTranscript) {
          if (onFinalRef.current) {
            onFinalRef.current(finalTranscript);
          }
          setListening(false);
        }
      };

      recognition.onerror = () => {
        setListening(false);
        setInterim('');
      };

      recognition.onend = () => {
        setListening(false);
        setInterim('');
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    try {
      recognitionRef.current.start();
      setListening(true);
      setInterim('');
    } catch (e) {
      console.error('Speech recognition error:', e);
      setListening(false);
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current || !listening) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('Speech recognition error:', e);
    }
    setListening(false);
  }, [listening]);

  return { supported, listening, interim, start, stop };
}

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio !== 'undefined' || 'speechSynthesis' in window) {
      setSupported(true);
    }

    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!supported) return;

    cancel();

    // Strip markdown syntax
    const cleanText = text
      .replace(/[*_#`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    if (!cleanText.trim()) return;

    setSpeaking(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error('TTS fetch failed');
      }

      const data = await res.json();
      if (!data.audioContent) {
        throw new Error('No audioContent');
      }

      const audio = new Audio('data:audio/mpeg;base64,' + data.audioContent);
      audioRef.current = audio;

      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);

      await audio.play();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const preferredVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          /Samantha|Google US English|Google UK English Female|female/i.test(v.name)
        );

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } else {
        setSpeaking(false);
      }
    }
  }, [supported, voices, cancel]);

  return { supported, speaking, speak, cancel };
}
