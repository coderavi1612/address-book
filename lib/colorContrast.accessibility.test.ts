import { describe, it, expect } from 'vitest';

/**
 * Color Contrast Accessibility Tests
 * Requirement: 14.3 - Test color contrast meets WCAG AA standards
 * 
 * WCAG AA Requirements:
 * - Normal text (< 18pt or < 14pt bold): Contrast ratio of at least 4.5:1
 * - Large text (>= 18pt or >= 14pt bold): Contrast ratio of at least 3:1
 * - UI components and graphical objects: Contrast ratio of at least 3:1
 */

/**
 * Calculate relative luminance of an RGB color
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Test if contrast ratio meets WCAG AA standard
 */
function meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

describe('Color Contrast Accessibility Tests - Requirement 14.3', () => {
  // Define color palette from design
  const colors = {
    background: '#ffffff',
    foreground: '#1a1a1a',
    border: '#e5e5e5',
    borderSelected: '#3b82f6',
    textPrimary: '#1a1a1a',
    textSecondary: '#737373',
    textMuted: '#a3a3a3',
    buttonPrimary: '#3b82f6',
    buttonHover: '#2563eb',
    buttonDanger: '#ef4444',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
  };
  
  describe('Text Contrast - Normal Text (4.5:1 minimum)', () => {
    it('should have sufficient contrast for primary text on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.textPrimary),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
    
    it('should have sufficient contrast for secondary text on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.textSecondary),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
    
    it('should have sufficient contrast for muted text on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.textMuted),
        hexToRgb(colors.background)
      );
      
      // Muted text should still meet minimum contrast
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
    
    it('should have sufficient contrast for foreground text on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.foreground),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
  });
  
  describe('Button Contrast - UI Components (3:1 minimum)', () => {
    it('should have sufficient contrast for primary button on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.buttonPrimary),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should have sufficient contrast for hover button on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.buttonHover),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should have sufficient contrast for danger button on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.buttonDanger),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should have sufficient contrast for white text on primary button', () => {
      const ratio = getContrastRatio(
        hexToRgb('#ffffff'),
        hexToRgb(colors.buttonPrimary)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
    
    it('should have sufficient contrast for white text on danger button', () => {
      const ratio = getContrastRatio(
        hexToRgb('#ffffff'),
        hexToRgb(colors.buttonDanger)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
  });
  
  describe('Border Contrast - UI Components (3:1 minimum)', () => {
    it('should have sufficient contrast for default border on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.border),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should have sufficient contrast for selected border on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.borderSelected),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('Status Indicator Contrast - UI Components (3:1 minimum)', () => {
    it('should have sufficient contrast for success indicator on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.success),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should have sufficient contrast for error indicator on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.error),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should have sufficient contrast for warning indicator on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.warning),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('Focus Indicator Contrast - UI Components (3:1 minimum)', () => {
    it('should have sufficient contrast for focus ring (blue) on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.borderSelected),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('Block Editor Specific Contrast', () => {
    it('should have sufficient contrast for form labels on white background', () => {
      // Form labels use textPrimary
      const ratio = getContrastRatio(
        hexToRgb(colors.textPrimary),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
    
    it('should have sufficient contrast for error messages on white background', () => {
      // Error text uses error color
      const ratio = getContrastRatio(
        hexToRgb(colors.error),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
  });
  
  describe('Layout Canvas Specific Contrast', () => {
    it('should have sufficient contrast for page numbers on white background', () => {
      // Page numbers use textMuted
      const ratio = getContrastRatio(
        hexToRgb(colors.textMuted),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
    
    it('should have sufficient contrast for block borders on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.border),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should have sufficient contrast for selected block border on white background', () => {
      const ratio = getContrastRatio(
        hexToRgb(colors.borderSelected),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('Toolbar Specific Contrast', () => {
    it('should have sufficient contrast for toolbar buttons on white background', () => {
      // Toolbar uses outline buttons with textPrimary
      const ratio = getContrastRatio(
        hexToRgb(colors.textPrimary),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(ratio, false)).toBe(true);
    });
  });
  
  describe('Page Navigator Specific Contrast', () => {
    it('should have sufficient contrast for page thumbnails on white background', () => {
      // Thumbnails use border color
      const ratio = getContrastRatio(
        hexToRgb(colors.border),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
    
    it('should have sufficient contrast for active page indicator', () => {
      // Active page uses borderSelected
      const ratio = getContrastRatio(
        hexToRgb(colors.borderSelected),
        hexToRgb(colors.background)
      );
      
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('Contrast Ratio Calculations', () => {
    it('should correctly calculate contrast ratio for black on white', () => {
      const ratio = getContrastRatio(
        hexToRgb('#000000'),
        hexToRgb('#ffffff')
      );
      
      // Black on white should be 21:1 (maximum contrast)
      expect(ratio).toBeCloseTo(21, 0);
    });
    
    it('should correctly calculate contrast ratio for white on black', () => {
      const ratio = getContrastRatio(
        hexToRgb('#ffffff'),
        hexToRgb('#000000')
      );
      
      // White on black should be 21:1 (maximum contrast)
      expect(ratio).toBeCloseTo(21, 0);
    });
    
    it('should correctly calculate contrast ratio for same colors', () => {
      const ratio = getContrastRatio(
        hexToRgb('#ffffff'),
        hexToRgb('#ffffff')
      );
      
      // Same colors should be 1:1 (no contrast)
      expect(ratio).toBeCloseTo(1, 0);
    });
  });
  
  describe('WCAG AA Compliance Summary', () => {
    it('should meet WCAG AA for all text elements', () => {
      const textContrasts = [
        { name: 'Primary text', ratio: getContrastRatio(hexToRgb(colors.textPrimary), hexToRgb(colors.background)) },
        { name: 'Secondary text', ratio: getContrastRatio(hexToRgb(colors.textSecondary), hexToRgb(colors.background)) },
        { name: 'Muted text', ratio: getContrastRatio(hexToRgb(colors.textMuted), hexToRgb(colors.background)) },
        { name: 'Foreground text', ratio: getContrastRatio(hexToRgb(colors.foreground), hexToRgb(colors.background)) },
      ];
      
      textContrasts.forEach(({ name, ratio }) => {
        expect(ratio, `${name} should meet WCAG AA (4.5:1)`).toBeGreaterThanOrEqual(4.5);
      });
    });
    
    it('should meet WCAG AA for all UI components', () => {
      const uiContrasts = [
        { name: 'Default border', ratio: getContrastRatio(hexToRgb(colors.border), hexToRgb(colors.background)) },
        { name: 'Selected border', ratio: getContrastRatio(hexToRgb(colors.borderSelected), hexToRgb(colors.background)) },
        { name: 'Primary button', ratio: getContrastRatio(hexToRgb(colors.buttonPrimary), hexToRgb(colors.background)) },
        { name: 'Success indicator', ratio: getContrastRatio(hexToRgb(colors.success), hexToRgb(colors.background)) },
        { name: 'Error indicator', ratio: getContrastRatio(hexToRgb(colors.error), hexToRgb(colors.background)) },
        { name: 'Warning indicator', ratio: getContrastRatio(hexToRgb(colors.warning), hexToRgb(colors.background)) },
      ];
      
      uiContrasts.forEach(({ name, ratio }) => {
        expect(ratio, `${name} should meet WCAG AA for UI components (3:1)`).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
