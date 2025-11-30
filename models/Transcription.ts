import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITranscription extends Document {
  audioUrl: string;
  transcription: string;
  createdAt: Date;
}

const TranscriptionSchema: Schema<ITranscription> = new Schema(
  {
    audioUrl: { type: String, required: true },
    transcription: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Transcription: Model<ITranscription> =
  mongoose.models.Transcription ||
  mongoose.model<ITranscription>("Transcription", TranscriptionSchema);

export default Transcription;
