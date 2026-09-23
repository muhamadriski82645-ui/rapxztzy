// Shared same-origin CORS handling for all /api/*.js Vercel Functions.
// Mirrors the strict CORS logic from the original server.js: only requests
// whose Origin/Referer host matches the request host are allowed.

function getAllowedOrigin(req) {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (origin) {
        try {
            const originUrl = new URL(origin);
            if (host && originUrl.host === host) return originUrl.origin;
            return null;
        } catch (e) {
            return null;
        }
    }
    if (host) {
        const proto = req.headers['x-forwarded-proto'] || 'https';
        return `${proto}://${host}`;
    }
    return null;
}

// Call at the very top of every handler. Returns true if the request has
// already been fully handled (OPTIONS preflight, or blocked cross-origin
// request) and the caller should return immediately.
function applyCors(req, res) {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    if (origin && host) {
        try {
            const originUrl = new URL(origin);
            if (originUrl.host !== host) {
                res.status(403).json({
                    status: false,
                    message: 'Access denied: Cross-origin requests from external domains are disabled.'
                });
                return true;
            }
        } catch (e) {}
    }

    const allowedOrigin = getAllowedOrigin(req);
    if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

module.exports = { applyCors };
