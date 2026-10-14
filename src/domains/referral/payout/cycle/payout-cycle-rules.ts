import { PayoutCycle } from "./payout-cycle.js";

/** A rule a payout cycle must pass. Check returns its problems, or none. */
export interface PayoutCycleRule {
  check(item: PayoutCycle): string[];
}

export class PayoutCycleCountryLengthRule implements PayoutCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutCycle): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutCycleRevisionRangeRule implements PayoutCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutCycle): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutCycleCodePrefixRule implements PayoutCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PayoutCycleAmountRangeRule implements PayoutCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutCycle): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutCycleCodeLengthRule implements PayoutCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a payout cycle. */
export class PayoutCycleValidator {
  rules: PayoutCycleRule[];

  constructor(rules: PayoutCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutCycle[]): Map<string, string[]> {
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

export function defaultPayoutCycleValidator(): PayoutCycleValidator {
  return new PayoutCycleValidator(
    [
      new PayoutCycleCountryLengthRule(255),
      new PayoutCycleRevisionRangeRule(64, 86400),
      new PayoutCycleCodePrefixRule("X"),
      new PayoutCycleAmountRangeRule(1.5, 2550.9),
      new PayoutCycleCodeLengthRule(16),
    ],
  );
}
