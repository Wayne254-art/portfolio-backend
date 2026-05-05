const buckets = new Map();

const getClientKey = (req, keyPrefix) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwarded)
        ? forwarded[0]
        : String(forwarded || req.ip || req.socket?.remoteAddress || "unknown").split(",")[0].trim();

    return `${keyPrefix}:${ip}:${req.path}`;
};

const rateLimit = ({
    windowMs = 15 * 60 * 1000,
    max = 100,
    keyPrefix = "default",
    message = "Too many requests. Please try again later.",
} = {}) => (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, keyPrefix);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        res.setHeader("RateLimit-Limit", String(max));
        res.setHeader("RateLimit-Remaining", String(Math.max(max - 1, 0)));
        return next();
    }

    current.count += 1;
    const remaining = Math.max(max - current.count, 0);

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
        return res.status(429).json({ error: message });
    }

    return next();
};

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of buckets.entries()) {
        if (value.resetAt <= now) buckets.delete(key);
    }
}, 10 * 60 * 1000).unref();

module.exports = rateLimit;
