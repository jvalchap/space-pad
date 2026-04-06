export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthSuccessResponse {
  accessToken: string;
  user: AuthUser;
}

export interface UsernameAvailabilityResponse {
  available: boolean;
}
