import * as text from "../../../../kit/text.js";
import { FallbackStepBaseline } from "./fallback-step-baseline.js";

/** A rule a fallback step baseline must pass. Check returns its problems, or none. */
export interface FallbackStepBaselineRule {
  check(item: FallbackStepBaseline): string[];
}

export class FallbackStepBaselineAllowedLabelRule implements FallbackStepBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackStepBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class FallbackStepBaselineLabelLengthRule implements FallbackStepBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackStepBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackStepBaselineStartsAtRangeRule implements FallbackStepBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStepBaseline): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback step baseline. */
export class FallbackStepBaselineValidator {
  rules: FallbackStepBaselineRule[];

  constructor(rules: FallbackStepBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackStepBaseline): string[] {
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

  requireValid(item: FallbackStepBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackStepBaseline[]): Map<string, string[]> {
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

export function defaultFallbackStepBaselineValidator(): FallbackStepBaselineValidator {
  return new FallbackStepBaselineValidator(
    [
      new FallbackStepBaselineAllowedLabelRule(["capped"]),
      new FallbackStepBaselineLabelLengthRule(1000),
      new FallbackStepBaselineStartsAtRangeRule(80, 3600),
    ],
  );
}
