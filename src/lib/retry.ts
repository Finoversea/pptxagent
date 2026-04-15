/**
 * Retry utilities - Exponential backoff with jitter for API calls
 */

import Anthropic from "@anthropic-ai/sdk";
import { RetryConfig } from "./config.js";

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is a rate limit error (HTTP 429 or Anthropic overload)
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return error.status === 429 || error.status === 529;
  }
  if (error instanceof Error) {
    // Anthropic SDK may throw errors with these messages
    const msg = error.message.toLowerCase();
    return msg.includes('rate limit') ||
           msg.includes('overloaded') ||
           msg.includes('429') ||
           msg.includes('529');
  }
  return false;
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('timeout') || msg.includes('etimedout');
  }
  return false;
}

/**
 * Check if error is retryable (rate limit, timeout, or transient network error)
 */
export function isRetryableError(error: unknown): boolean {
  return isRateLimitError(error) || isTimeoutError(error);
}

/**
 * Get a summary string for an error
 */
export function getErrorSummary(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    return `API Error ${error.status}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message.slice(0, 100);
  }
  return String(error);
}

/**
 * Retry with exponential backoff
 *
 * @param fn - Function to execute
 * @param retryConfig - Retry configuration
 * @param isRetryable - Predicate to determine if error is retryable (default: rate limit errors)
 * @returns Result of the function or throws after max retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig: RetryConfig,
  isRetryable?: (error: unknown) => boolean
): Promise<T> {
  const shouldRetry = isRetryable || isRateLimitError;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retryConfig.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > retryConfig.maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const baseDelay = Math.min(
        retryConfig.initialRetryMs * Math.pow(2, attempt - 1),
        retryConfig.maxRetryMs
      );
      const jitter = Math.random() * 0.1 * baseDelay;
      const delay = baseDelay + jitter;

      console.warn(`Retry attempt ${attempt}/${retryConfig.maxRetries} after ${delay}ms due to: ${getErrorSummary(error)}`);
      await sleep(delay);
    }
  }

  throw lastError;
}