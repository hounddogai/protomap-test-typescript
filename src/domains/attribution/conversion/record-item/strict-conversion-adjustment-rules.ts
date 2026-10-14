import * as text from "../../../../kit/text.js";
import { StrictConversionAdjustment } from "./strict-conversion-adjustment.js";

/** A rule a strict conversion adjustment must pass. Check returns its problems, or none. */
export interface StrictConversionAdjustmentRule {
  check(item: StrictConversionAdjustment): string[];
}

export class StrictConversionAdjustmentRetriesRangeRule implements StrictConversionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictConversionAdjustment): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictConversionAdjustmentAllowedCodeRule implements StrictConversionAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictConversionAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class StrictConversionAdjustmentLabelLengthRule implements StrictConversionAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictConversionAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict conversion adjustment. */
export class StrictConversionAdjustmentValidator {
  rules: StrictConversionAdjustmentRule[];

  constructor(rules: StrictConversionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictConversionAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: StrictConversionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictConversionAdjustment[]): Map<string, string[]> {
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

export function defaultStrictConversionAdjustmentValidator(): StrictConversionAdjustmentValidator {
  return new StrictConversionAdjustmentValidator(
    [
      new StrictConversionAdjustmentRetriesRangeRule(80, 86400),
      new StrictConversionAdjustmentAllowedCodeRule([]),
      new StrictConversionAdjustmentLabelLengthRule(1000),
    ],
  );
}
