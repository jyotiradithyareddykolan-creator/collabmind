import mongoose from "mongoose";

const debateCommentSchema = new mongoose.Schema(
  {
    debate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Debate",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null when isAI is true
    },
    isAI: {
      type: Boolean,
      default: false,
    },
    aiType: {
      type: String,
      enum: ["counter", "participant", null],
      default: null,
    },
    groundedInDocs: {
      type: Boolean,
      default: false,
    },
    stance: {
      type: String,
      enum: ["for", "against", "neutral"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("DebateComment", debateCommentSchema);