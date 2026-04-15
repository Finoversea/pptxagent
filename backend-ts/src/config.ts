/**
 * Configuration with validation
 */

import z from "zod";

const ConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  PORT: z.string().default("8001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
  // Rate limiting and retry configuration
  ANTHROPIC_MAX_RETRIES: z.string().default("3"),
  ANTHROPIC_INITIAL_RETRY_MS: z.string().default("1000"),
  ANTHROPIC_MAX_RETRY_MS: z.string().default("16000"),
  ANTHROPIC_REQUEST_TIMEOUT_MS: z.string().default("30000"),
  ANTHROPIC_RATE_LIMIT_RPM: z.string().default("60"),
});

export type Config = z.infer<typeof ConfigSchema>;

// Retry/rate limit configuration derived from env vars
export interface RetryConfig {
  maxRetries: number;
  initialRetryMs: number;
  maxRetryMs: number;
  requestTimeoutMs: number;
  rateLimitRpm: number;
}

export function loadConfig(): Config {
  const rawConfig = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    ANTHROPIC_MAX_RETRIES: process.env.ANTHROPIC_MAX_RETRIES,
    ANTHROPIC_INITIAL_RETRY_MS: process.env.ANTHROPIC_INITIAL_RETRY_MS,
    ANTHROPIC_MAX_RETRY_MS: process.env.ANTHROPIC_MAX_RETRY_MS,
    ANTHROPIC_REQUEST_TIMEOUT_MS: process.env.ANTHROPIC_REQUEST_TIMEOUT_MS,
    ANTHROPIC_RATE_LIMIT_RPM: process.env.ANTHROPIC_RATE_LIMIT_RPM,
  };

  const result = ConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error("Configuration validation failed:");
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    });

    // In development, allow missing API key with warning
    if (rawConfig.NODE_ENV === "development" && !rawConfig.ANTHROPIC_API_KEY) {
      console.warn("Warning: ANTHROPIC_API_KEY not set. Using fallback content.");
      return {
        ANTHROPIC_API_KEY: "",
        PORT: "8001",
        NODE_ENV: "development",
        CORS_ORIGINS: "http://localhost:3000,http://localhost:3001",
        ANTHROPIC_MAX_RETRIES: "3",
        ANTHROPIC_INITIAL_RETRY_MS: "1000",
        ANTHROPIC_MAX_RETRY_MS: "16000",
        ANTHROPIC_REQUEST_TIMEOUT_MS: "30000",
        ANTHROPIC_RATE_LIMIT_RPM: "60",
      };
    }

    throw new Error("Invalid configuration");
  }

  return result.data;
}

export function getRetryConfig(cfg: Config): RetryConfig {
  return {
    maxRetries: parseInt(cfg.ANTHROPIC_MAX_RETRIES, 10),
    initialRetryMs: parseInt(cfg.ANTHROPIC_INITIAL_RETRY_MS, 10),
    maxRetryMs: parseInt(cfg.ANTHROPIC_MAX_RETRY_MS, 10),
    requestTimeoutMs: parseInt(cfg.ANTHROPIC_REQUEST_TIMEOUT_MS, 10),
    rateLimitRpm: parseInt(cfg.ANTHROPIC_RATE_LIMIT_RPM, 10),
  };
}

export const config = loadConfig();