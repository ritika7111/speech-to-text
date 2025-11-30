import sdk from "microsoft-cognitiveservices-speech-sdk";

const key = process.env.AZURE_SPEECH_KEY;
const region = process.env.AZURE_SPEECH_REGION;

/**
 * Mock transcription used when no Azure key is provided.
 */
function mockTranscription() {
  console.log("Azure Speech API not configured — using mock transcription.");
  return "mock azure transcription text";
}

/**
 * Perform Azure transcription with optional retry & exponential backoff.
 */
export async function transcribeWithAzure(
  audioUrl: string,
  language: string = "en-US",
  attempt: number = 1
): Promise<string> {
  const MAX_ATTEMPTS = 3;

  // Mock transcription if credentials missing
  if (!key || !region) return mockTranscription();

  try {
    console.log(`Downloading audio (mock) from: ${audioUrl}`);

    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechRecognitionLanguage = language;

    const audioConfig = sdk.AudioConfig.fromStreamInput(
      sdk.AudioInputStream.createPushStream() // Still mock; not downloading actual audio bytes
    );

    // console.log('audioConfig',audioConfig);

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    console.log("Starting Azure speech recognition...");
    // console.log('recognizer',recognizer);
    return await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve(result.text);
          } else {
            reject(new Error("Azure failed to transcribe audio"));
          }
        },
        (error) => reject(error)
      );
    });
  } catch (error) {
    console.error(`Azure transcription failed (attempt ${attempt})`, error);

    if (attempt < MAX_ATTEMPTS) {
      const delay = Math.pow(2, attempt) * 300; // exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));

      return transcribeWithAzure(audioUrl, language, attempt + 1);
    }

    throw error; // final failure
  }
}

async function timeLimit(promise: Promise<any>, ms: number) {
  let timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms)
  );
  return Promise.race([promise, timeout]);
}
