import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAzureTranscription extends Document {
  audioUrl: string;
  transcription: string;
  source: string;
  language: string;
  createdAt: Date;
}

const AzureTxSchema: Schema<IAzureTranscription> = new Schema(
  {
    audioUrl: { type: String, required: true },
    transcription: { type: String, required: true },
    source: { type: String, default: "azure" },
    language: { type: String, default: "en-US" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AzureTranscription: Model<IAzureTranscription> =
  mongoose.models.AzureTranscription ||
  mongoose.model<IAzureTranscription>("AzureTranscription", AzureTxSchema);

export default AzureTranscription;
