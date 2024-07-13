import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define a new interface for the payload of the JWT token
interface UserPayload {
  id: string;
  email: string;
}

// Augment the Request interface to include the currentUser property  
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const currentUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If the user is not logged in, move on to the next middleware
  if (!req.session?.jwt) {
    return next();
  }

  // If the user is logged in, verify the JWT token
  try {
    // If the token is invalid, an error will be thrown
    const payload = jwt.verify(
      req.session.jwt,
      process.env.JWT_KEY!
    ) as UserPayload;
    req.currentUser = payload;
  } catch (error) {
    res.send({ currentUser: null });
  }

  // Move on to the next middleware
  next();
};
