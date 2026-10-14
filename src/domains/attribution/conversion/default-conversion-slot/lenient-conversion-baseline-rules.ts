import * as text from "../../../../kit/text.js";
import { LenientConversionBaseline } from "./lenient-conversion-baseline.js";

/** A rule a lenient conversion baseline must pass. Check returns its problems, or none. */
export interface LenientConversionBaselineRule {
  check(item: LenientConversionBaseline): string[];
}

export class LenientConversionBaselineDiscountRangeRule implements LenientConversionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientConversionBaseline): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientConversionBaselineAllowedCodeRule implements LenientConversionBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientConversionBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class LenientConversionBaselineLabelLengthRule implements LenientConversionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientConversionBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient conversion baseline. */
export class LenientConversionBaselineValidator {
  rules: LenientConversionBaselineRule[];

  constructor(rules: LenientConversionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: LenientConversionBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientConversionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientConversionBaseline[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultLenientConversionBaselineValidator(): LenientConversionBaselineValidator {
  return new LenientConversionBaselineValidator(
    [
      new LenientConversionBaselineDiscountRangeRule(5.7, 1483.3),
      new LenientConversionBaselineAllowedCodeRule([]),
      new LenientConversionBaselineLabelLengthRule(1000),
    ],
  );
}
