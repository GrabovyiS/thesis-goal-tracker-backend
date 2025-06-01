const normalizeField = (value) => {
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (!isNaN(value) && value.trim() !== "") return Number(value);
  return value;
};

export { normalizeField };
