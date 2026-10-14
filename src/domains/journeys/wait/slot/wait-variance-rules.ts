import { WaitVariance } from "./wait-variance.js";

/** A rule a wait variance must pass. Check returns its problems, or none. */
export interface WaitVarianceRule {
  check(item: WaitVariance): string[];
}

export class WaitVarianceRequiredTimezoneRule implements WaitVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitVariance): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class WaitVarianceRequiredTitleRule implements WaitVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitVarianceCreatedAtRangeRule implements WaitVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitVariance): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitVarianceMarginRangeRule implements WaitVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitVariance): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitVarianceRequiredCodeRule implements WaitVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitVarianceConversionRateRangeRule implements WaitVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitVariance): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a wait variance. */
export class WaitVarianceValidator {
  rules: WaitVarianceRule[];

  constructor(rules: WaitVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: WaitVariance): string[] {
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

  requireValid(item: WaitVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitVariance[]): Map<string, string[]> {
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

export function defaultWaitVarianceValidator(): WaitVarianceValidator {
  return new WaitVarianceValidator(
    [
      new WaitVarianceRequiredTimezoneRule("wait variance needs this field"),
      new WaitVarianceRequiredTitleRule("wait variance needs a value"),
      new WaitVarianceCreatedAtRangeRule(64, 255),
      new WaitVarianceMarginRangeRule(7.7, 4027.9),
      new WaitVarianceRequiredCodeRule("wait variance needs a value"),
      new WaitVarianceConversionRateRangeRule(4.8, 1765.7),
    ],
  );
}
