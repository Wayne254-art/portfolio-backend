const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const cleanString = (value = "", maxLength = 500) =>
    String(value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, maxLength);

const cleanMultiline = (value = "", maxLength = 2000) =>
    String(value ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim()
        .slice(0, maxLength);

const normalizeEmail = (value = "") => cleanString(value, 254).toLowerCase();

const isValidEmail = (value = "") =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

const isSafeUrl = (value = "", required = false) => {
    const cleaned = cleanString(value, 500);
    if (!cleaned) return !required;

    try {
        const url = new URL(cleaned);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};

const extractArrayField = (body, fieldName) => {
    if (Array.isArray(body[fieldName])) return body[fieldName];
    if (typeof body[fieldName] === "string") {
        try {
            const parsed = JSON.parse(body[fieldName]);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return [body[fieldName]];
        }
    }

    return Object.keys(body)
        .filter((key) => key.startsWith(`${fieldName}[`))
        .sort((a, b) => {
            const aIndex = Number(a.match(/\[(\d+)\]/)?.[1] ?? 0);
            const bIndex = Number(b.match(/\[(\d+)\]/)?.[1] ?? 0);
            return aIndex - bIndex;
        })
        .map((key) => body[key]);
};

module.exports = {
    cleanMultiline,
    cleanString,
    escapeHtml,
    extractArrayField,
    isSafeUrl,
    isValidEmail,
    normalizeEmail,
};
