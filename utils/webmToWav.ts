import wavEncoder from "wav-encoder";

export async function webmToWav(webmBuffer: Buffer): Promise<Buffer> {
  const audioCtx = new AudioContext();
  
  const decoded = await audioCtx.decodeAudioData(webmBuffer.buffer.slice(0));

  const wavBuffer = await wavEncoder.encode({
    sampleRate: decoded.sampleRate,
    channelData: Array.from({ length: decoded.numberOfChannels }, (_, i) =>
      decoded.getChannelData(i)
    ),
  });

  return Buffer.from(wavBuffer);
}
