import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { addressBlockSchema, nameSchema } from './block';

describe('Feature: address-book-pdf-builder - Zod Schema Validation', () => {
  it('Property 3: Names Array Validation - empty names array should fail validation', () => {
    /**
     * **Validates: Requirements 2.5, 15.2**
     * 
     * For any address block with an empty names array, attempting to save should fail validation.
     */
    fc.assert(
      fc.property(
        fc.record({
          names: fc.constant([]), // Empty array
          address: fc.string({ maxLength: 500 }),
          mobile: fc.oneof(
            fc.constant(''),
            fc.stringMatching(/^[0-9\s\-()]+$/)
          ),
          x: fc.nat(),
          y: fc.nat(),
          width: fc.integer({ min: 1 }),
          height: fc.integer({ min: 1 }),
          page_number: fc.integer({ min: 1 }),
        }),
        (block) => {
          const result = addressBlockSchema.safeParse(block);
          // Empty names array should always fail validation
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 22: Mobile Number Format Validation - invalid mobile formats should fail validation', () => {
    /**
     * **Validates: Requirements 15.3**
     * 
     * For any mobile number string containing characters other than digits, spaces, hyphens, 
     * and parentheses, validation should fail.
     */
    fc.assert(
      fc.property(
        fc.record({
          names: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1 }),
          address: fc.string({ maxLength: 500 }),
          mobile: fc.string().filter((s) => {
            // Generate strings that contain invalid characters
            return s.length > 0 && !/^[0-9\s\-()]*$/.test(s);
          }),
          x: fc.nat(),
          y: fc.nat(),
          width: fc.integer({ min: 1 }),
          height: fc.integer({ min: 1 }),
          page_number: fc.integer({ min: 1 }),
        }),
        (block) => {
          const result = addressBlockSchema.safeParse(block);
          // Invalid mobile format should always fail validation
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 23: Address Length Validation - addresses over 500 characters should fail validation', () => {
    /**
     * **Validates: Requirements 15.4**
     * 
     * For any address string longer than 500 characters, validation should fail.
     */
    fc.assert(
      fc.property(
        fc.record({
          names: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1 }),
          address: fc.string({ minLength: 501 }), // Over the limit
          mobile: fc.oneof(
            fc.constant(''),
            fc.stringMatching(/^[0-9\s\-()]+$/)
          ),
          x: fc.nat(),
          y: fc.nat(),
          width: fc.integer({ min: 1 }),
          height: fc.integer({ min: 1 }),
          page_number: fc.integer({ min: 1 }),
        }),
        (block) => {
          const result = addressBlockSchema.safeParse(block);
          // Address over 500 characters should always fail validation
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 24: Name Length Validation - names over 100 characters should fail validation', () => {
    /**
     * **Validates: Requirements 15.5**
     * 
     * For any name string longer than 100 characters, validation should fail.
     */
    fc.assert(
      fc.property(
        fc.record({
          names: fc.array(
            fc.string({ minLength: 101 }), // Over the limit
            { minLength: 1 }
          ),
          address: fc.string({ maxLength: 500 }),
          mobile: fc.oneof(
            fc.constant(''),
            fc.stringMatching(/^[0-9\s\-()]+$/)
          ),
          x: fc.nat(),
          y: fc.nat(),
          width: fc.integer({ min: 1 }),
          height: fc.integer({ min: 1 }),
          page_number: fc.integer({ min: 1 }),
        }),
        (block) => {
          const result = addressBlockSchema.safeParse(block);
          // Name over 100 characters should always fail validation
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
