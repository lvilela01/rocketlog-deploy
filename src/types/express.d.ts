declare namespace Express {
  export interface Request { // Add (mescla) user com a interface de Request existente no Express
    user?: {
      id: string
      role: string
    }
  }
}
