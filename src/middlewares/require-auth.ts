import { Request, Response, NextFunction } from "express";
import { NotAuthorizedError } from "../errors/not-authorized-error";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If the user is not logged in, return a 401 status code
  if (!req.currentUser) {
    throw new NotAuthorizedError();
  }

  // If the user is logged in, move on to the next middleware
  next();
};
