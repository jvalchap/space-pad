export interface AuthUserPayload {
  id: string;
  email: string;
  username: string;
}

export interface AuthSuccessPayload {
  accessToken: string;
  user: AuthUserPayload;
}

export interface JwtValidatedUser {
  userId: string;
  email: string;
  username: string;
}
