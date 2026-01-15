const MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const parseDurationMs = (value) => {
  if (typeof value === "number") {
    return value;
  }
  const match = String(value).trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return amount * MS[unit];
};

module.exports = { parseDurationMs };
