import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

interface DecodedToken {
  userType: string;
  [key: string]: any;
}

// Middleware for role-based access control
const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as DecodedToken;

      // Check if the user's role is allowed
      if (!allowedRoles.includes(decoded.userType)) {
        return res
          .status(403)
          .json({ message: "Access denied. Insufficient permissions." });
      }

      // Attach user info to the request object for use in subsequent routes
      req.user = decoded;
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      return res.status(400).json({ message: "Invalid token." });
    }
  };
};

export default authorize;
