"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const languageNames: Record<string, string> = {
  "en-US": "English",
  "kn-IN": "Kannada",
  "mr-IN": "Marathi",
};

export default function ReceptionListenerPage() {
  const supabase = createClient();

  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  /*
   * Load browser voices.
   *
   * Chrome may not have the voices ready immediately,
   * so we listen for voiceschanged as well.
   */
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setVoiceStatus(
        "Text-to-speech is not supported in this browser."
      );
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      voicesRef.current = voices;

      console.log(
        "Available speech voices:",
        voices.map(v => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService,
        }))
      );
    };

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );

      window.speechSynthesis.cancel();
    };
  }, []);

  /*
   * Find the correct voice for the requested language.
   */
  function findVoice(languageCode: string) {
    const voices = voicesRef.current;

    if (!voices.length) {
      return null;
    }

    /*
     * First try exact language.
     *
     * Example:
     * kn-IN
     * mr-IN
     * en-US
     */
    let voice = voices.find(
      v =>
        v.lang.toLowerCase() ===
        languageCode.toLowerCase()
    );

    if (voice) {
      return voice;
    }

    /*
     * Then try the language family.
     *
     * Example:
     * kn-IN -> kn
     * mr-IN -> mr
     */
    const shortLanguage =
      languageCode.split("-")[0].toLowerCase();

    voice = voices.find(
      v =>
        v.lang
          .toLowerCase()
          .startsWith(shortLanguage + "-") ||
        v.lang.toLowerCase() === shortLanguage
    );

    return voice || null;
  }

  /*
   * Speak the announcement using the correct
   * language voice.
   */
  function speakMessage(
    text: string,
    languageCode: string
  ) {
    if (!("speechSynthesis" in window)) {
      setVoiceStatus(
        "Text-to-speech is not supported."
      );
      return;
    }

    /*
     * Get voices again because Chrome can load them
     * after the page initially opens.
     */
    const currentVoices =
      window.speechSynthesis.getVoices();

    if (currentVoices.length > 0) {
      voicesRef.current = currentVoices;
    }

    const voice =
      findVoice(languageCode);

    console.log(
      "Requested language:",
      languageCode
    );

    console.log(
      "Selected voice:",
      voice
        ? `${voice.name} (${voice.lang})`
        : "NO MATCHING VOICE"
    );

    /*
     * Important:
     * Do NOT silently use an English voice for
     * Kannada/Marathi.
     */
    if (!voice) {
      setVoiceStatus(
        `No ${languageNames[languageCode] || languageCode} speech voice is available on this computer.`
      );

      console.warn(
        `No voice found for ${languageCode}.`
      );

      return;
    }

    setVoiceStatus(
      `Speaking using ${voice.name} (${voice.lang})`
    );

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    /*
     * Set BOTH:
     *
     * 1. voice
     * 2. language
     *
     * Setting only lang is not enough.
     */
    speech.voice = voice;

    speech.lang = voice.lang;

    speech.volume = 1;

    speech.rate = 0.9;

    speech.pitch = 1;

    speech.onstart = () => {
      console.log(
        "🔊 Speech started:",
        voice.name,
        voice.lang
      );
    };

    speech.onend = () => {
      console.log(
        "🔊 Speech finished"
      );
    };

    speech.onerror = event => {
      console.error(
        "Speech error:",
        event
      );

      setVoiceStatus(
        `Speech error: ${event.error}`
      );
    };

    window.speechSynthesis.speak(
      speech
    );
  }

  /*
   * Subscribe to receptionist live calls.
   */
  useEffect(() => {
    const channel = supabase.channel(
      "clinic:reception",
      {
        config: {
          broadcast: {
            ack: true,
          },
        },
      }
    );

    channel
      .on(
        "broadcast",
        {
          event: "patient_call",
        },
        payload => {
          console.log(
            "✅ Received announcement:",
            payload
          );

          const text =
            payload.payload?.message || "";

          const languageCode =
            payload.payload?.language_code ||
            "en-US";

          setMessage(text);

          setLanguage(languageCode);

          /*
           * Wait briefly if Chrome has not populated
           * its voices yet.
           */
          if (
            "speechSynthesis" in window
          ) {
            const voices =
              window.speechSynthesis.getVoices();

            if (voices.length > 0) {
              voicesRef.current =
                voices;

              speakMessage(
                text,
                languageCode
              );
            } else {
              /*
               * Give Chrome a moment to load
               * the available voices.
               */
              setTimeout(() => {
                const loadedVoices =
                  window.speechSynthesis
                    .getVoices();

                voicesRef.current =
                  loadedVoices;

                speakMessage(
                  text,
                  languageCode
                );
              }, 500);
            }
          }
        }
      )
      .subscribe(status => {
        console.log(
          "📡 Reception channel status:",
          status
        );
      });

    return () => {
      window.speechSynthesis?.cancel();

      supabase.removeChannel(
        channel
      );
    };
  }, [supabase]);

  return (
    <div className="container">

      <h1>
        Reception Patient Calling
      </h1>

      <div className="card">

        {message ? (
          <>
            <h2>
              🔊 Patient Announcement
            </h2>

            <p
              style={{
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              {message}
            </p>

            <p>
              Language:{" "}
              {languageNames[language] ||
                language}
            </p>

            {voiceStatus && (
              <p className="muted">
                {voiceStatus}
              </p>
            )}

            <button
              className="btn secondary"
              onClick={() =>
                speakMessage(
                  message,
                  language
                )
              }
            >
              🔊 Speak Again
            </button>
          </>
        ) : (
          <p className="muted">
            Waiting for doctor announcement...
          </p>
        )}

      </div>

    </div>
  );
}