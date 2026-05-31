export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};
