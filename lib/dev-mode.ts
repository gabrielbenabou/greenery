// Dev mode configuration
export const isDevMode = process.env.NODE_ENV === "development" && process.env.DEV_MODE === "true"

// Mock superadmin user for dev mode
export const mockSuperAdmin = {
  id: "dev-superadmin-123",
  email: "superadmin@dev.local",
  role: "superadmin",
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_metadata: {
    name: "Super Admin",
    role: "superadmin",
  },
  app_metadata: {
    provider: "dev",
    providers: ["dev"],
  },
}

// Mock session for dev mode
export const mockSession = {
  access_token: "dev-access-token",
  refresh_token: "dev-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: mockSuperAdmin,
}
