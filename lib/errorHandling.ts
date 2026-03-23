import { toast } from 'sonner';

/**
 * Custom application error class with error codes and retry capability
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds (default: 1000)
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's not the last attempt
      if (i < maxRetries - 1) {
        // Exponential backoff: delay * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}

/**
 * Handle errors with user-friendly messages and logging
 * @param error - The error to handle
 * @param context - Context string describing where the error occurred
 */
export function handleError(error: unknown, context: string): void {
  console.error(`Error in ${context}:`, error);

  if (error instanceof AppError) {
    toast.error(error.message);
  } else if (error instanceof Error) {
    toast.error(`An error occurred: ${error.message}`);
  } else {
    toast.error('An unexpected error occurred');
  }
}
