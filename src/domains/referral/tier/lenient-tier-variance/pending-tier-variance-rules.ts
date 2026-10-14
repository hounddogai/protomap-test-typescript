import { PendingTierVariance } from "./pending-tier-variance.js";

/** A rule a pending tier variance must pass. Check returns its problems, or none. */
export interface PendingTierVarianceRule {
  check(item: PendingTierVariance): string[];
}

export class PendingTierVarianceNameLengthRule implements PendingTierVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingTierVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingTierVarianceRequiredCodeRule implements PendingTierVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingTierVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingTierVarianceMinimumRangeRule implements PendingTierVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingTierVariance): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pending tier variance. */
export class PendingTierVarianceValidator {
  rules: PendingTierVarianceRule[];

  constructor(rules: PendingTierVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PendingTierVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingTierVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingTierVariance[]): Map<string, string[]> {
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

export function defaultPendingTierVarianceValidator(): PendingTierVarianceValidator {
  return new PendingTierVarianceValidator(
    [
      new PendingTierVarianceNameLengthRule(86400),
      new PendingTierVarianceRequiredCodeRule("pending tier variance needs this field"),
      new PendingTierVarianceMinimumRangeRule(7.6, 1894.1),
    ],
  );
}
