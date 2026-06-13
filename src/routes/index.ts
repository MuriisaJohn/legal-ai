export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  DOCUMENTS: '/documents',
  VOICE: '/voice',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
} as const;

export type RouteKey = keyof typeof ROUTES;
