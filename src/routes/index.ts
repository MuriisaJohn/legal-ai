export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  DOCUMENTS: '/documents',
  VOICE: '/voice',
  ABOUT: '/about',
} as const;

export type RouteKey = keyof typeof ROUTES;
