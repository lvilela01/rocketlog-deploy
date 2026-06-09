import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { AppError } from "@/utils/AppError";
import { authConfig } from "@/configs/auth";

interface Tokenpayload {
  role: string
  sub: string
}

export function ensureAuthenticated(request: Request, response: Response, next: NextFunction){
  try {
    const authHeader = request.headers.authorization

    if(!authHeader){
      throw new AppError('JWT token not found', 401)
    }

    // Bearer 456412d4sa546 - pega apenas a posição da numeração (token)
    const [, token] = authHeader.split(' ')

    const {role, sub: user_id} = verify(token, authConfig.jwt.secret) as Tokenpayload

    request.user = {
      id: user_id,
      role,
    }

    return next()

  } catch (error) {
    throw new AppError('Invalid JWT token', 401)
  }
}
