const jwt = require("jsonwebtoken");

// Public key from Keycloak → Realm Settings → Keys → RS256 → Public Key
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1Ey/6BSVrEYNcMoB1XEur7JnN7yHisD9K1k8JBtgN1x3CmPvbh/up65EcF+Fo+VbKnfBxLbv7OJnc8bGxypZtMdbhDjoPHO2E5Ud9VphTCHkgodSi90agCnLOSfIuj0OGCsaZ/8UlVIQZynPEvxBqt1dG2v5kdBb0fRHPI+OflLPTErUtJEUTKBNE1rDGYoUsOLHrvp2cpU1nVBMslox+LLOidLpQKltOBrfFVaGE55IgGYG9lbSgdgnDL0UIqIfzKOT55MMp6OqUTAvim5H/1SUWo+16JyYkvzO0YLdikPLMEiL0zYXGSWCsvNSEtLjeGeACyQs0n2aiKdu/dD25wIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Middleware to verify JWT from Keycloak
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Middleware to check if user has a specific role
 * - Works with realm roles in `realm_access.roles`
 * - Works with client roles in `resource_access[client_id].roles`
 */
function checkRole(requiredRole, clientId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let hasRole = false;

    // Realm-level role check
    if (req.user.realm_access?.roles?.includes(requiredRole)) {
      hasRole = true;
    }

    // Client-level role check (if clientId provided)
    if (
      clientId &&
      req.user.resource_access?.[clientId]?.roles?.includes(requiredRole)
    ) {
      hasRole = true;
    }

    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }

    next();
  };
}

module.exports = { verifyToken, checkRole };
