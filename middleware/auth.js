// Middleware layer for authentication
import { getUserRoleByUserId } from "../models/usersRoles.js";
import { verifyAccessToken } from "../utils/jwt.js";

// authenticateToken goes first to decode the user object
export function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    // "Bearer <token>"
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res
            .status(401)
            .json({ error: "Unauthorized. No token provided" });
    }

    try {
        const decodedAccessToken = verifyAccessToken(token);
        // Add decoded user object to request
        req.user = decodedAccessToken;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Forbidden. Token Invalid" });
    }
}

// Then we check the role of the user to allow entry
// authorizeRole(['admin']) - Only allow admins in
// authorizeRole() - Allow any user in
export function authorizeRole(roles = []) {
    return async (req, res, next) => {
        // If user is not logged in
        if (!req.user) {
            return res
                .status(401)
                .json({ error: "Unauthorized. User not logged in" });
        }

        const userRole = await getUserRoleByUserId({
            user_id: req.user.user_id,
        });

        if (roles.length && !roles.includes(userRole)) {
            return res
                .status(403)
                .json({ error: "Forbidden. Insufficient Permissions" });
        }

        next();
    };
}
