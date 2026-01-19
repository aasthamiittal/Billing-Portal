const AuditLog = require("../models/AuditLog");

async function audit({ actorId, action, entityType, entityId, metadata = {} }) {
  try {
    await AuditLog.create({
      actor: actorId,
      action,
      entityType,
      entityId: String(entityId),
      metadata,
    });
  } catch {
    // Never block the request on audit failures.
  }
}

module.exports = { audit };

