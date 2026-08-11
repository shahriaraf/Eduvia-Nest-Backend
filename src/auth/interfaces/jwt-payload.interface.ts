/** Shape encoded into the JWT and returned by the passport-jwt strategy. */
export interface JwtPayload {
  sub: string;
  email: string;
}

/** The `req.user` shape controllers see once a request passes JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string;
  email: string;
}
