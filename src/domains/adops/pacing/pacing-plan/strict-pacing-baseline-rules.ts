import * as text from "../../../../kit/text.js";
import { StrictPacingBaseline } from "./strict-pacing-baseline.js";

/** A rule a strict pacing baseline must pass. Check returns its problems, or none. */
export interface StrictPacingBaselineRule {
  check(item: StrictPacingBaseline): string[];
}

export class StrictPacingBaselineAllowedChannelRule implements StrictPacingBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictPacingBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is not allowed`];
    return [];
  }
}

export class StrictPacingBaselineChannelLengthRule implements StrictPacingBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPacingBaseline): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPacingBaselineBudgetRangeRule implements StrictPacingBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPacingBaseline): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictPacingBaselineExternalRefLengthRule implements StrictPacingBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPacingBaseline): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict pacing baseline. */
export class StrictPacingBaselineValidator {
  rules: StrictPacingBaselineRule[];

  constructor(rules: StrictPacingBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPacingBaseline): string[] {
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

  requireValid(item: StrictPacingBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPacingBaseline[]): Map<string, string[]> {
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

export function defaultStrictPacingBaselineValidator(): StrictPacingBaselineValidator {
  return new StrictPacingBaselineValidator(
    [
      new StrictPacingBaselineAllowedChannelRule([]),
      new StrictPacingBaselineChannelLengthRule(86400),
      new StrictPacingBaselineBudgetRangeRule(3.3, 3332.2),
      new StrictPacingBaselineExternalRefLengthRule(1000),
    ],
  );
}
