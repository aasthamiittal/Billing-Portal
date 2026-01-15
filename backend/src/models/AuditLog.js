const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
