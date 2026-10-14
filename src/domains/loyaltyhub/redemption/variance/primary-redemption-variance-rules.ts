import { PrimaryRedemptionVariance } from "./primary-redemption-variance.js";

/** A rule a primary redemption variance must pass. Check returns its problems, or none. */
export interface PrimaryRedemptionVarianceRule {
  check(item: PrimaryRedemptionVariance): string[];
}

export class PrimaryRedemptionVarianceCodePrefixRule implements PrimaryRedemptionVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryRedemptionVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryRedemptionVarianceCapacityRangeRule implements PrimaryRedemptionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryRedemptionVariance): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryRedemptionVarianceRequiredCodeRule implements PrimaryRedemptionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRedemptionVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRedemptionVarianceAmountRangeRule implements PrimaryRedemptionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryRedemptionVariance): string[] {
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

export class PrimaryRedemptionVarianceNameLengthRule implements PrimaryRedemptionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRedemptionVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary redemption variance. */
export class PrimaryRedemptionVarianceValidator {
  rules: PrimaryRedemptionVarianceRule[];

  constructor(rules: PrimaryRedemptionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryRedemptionVariance): string[] {
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

  requireValid(item: PrimaryRedemptionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryRedemptionVariance[]): Map<string, string[]> {
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

export function defaultPrimaryRedemptionVarianceValidator(): PrimaryRedemptionVarianceValidator {
  return new PrimaryRedemptionVarianceValidator(
    [
      new PrimaryRedemptionVarianceCodePrefixRule("Q"),
      new PrimaryRedemptionVarianceCapacityRangeRule(255, 86400),
      new PrimaryRedemptionVarianceRequiredCodeRule("primary redemption variance needs an entry"),
      new PrimaryRedemptionVarianceAmountRangeRule(2.1, 1645.9),
      new PrimaryRedemptionVarianceNameLengthRule(1000),
    ],
  );
}
