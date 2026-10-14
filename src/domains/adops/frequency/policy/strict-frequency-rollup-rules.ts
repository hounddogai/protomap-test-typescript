import { StrictFrequencyRollup } from "./strict-frequency-rollup.js";

/** A rule a strict frequency rollup must pass. Check returns its problems, or none. */
export interface StrictFrequencyRollupRule {
  check(item: StrictFrequencyRollup): string[];
}

export class StrictFrequencyRollupRequiredCodeRule implements StrictFrequencyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictFrequencyRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictFrequencyRollupApprovedGuardRule implements StrictFrequencyRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictFrequencyRollup): string[] {
    if (item.approved && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StrictFrequencyRollupRequiredCurrencyRule implements StrictFrequencyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictFrequencyRollup): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class StrictFrequencyRollupDiscountRangeRule implements StrictFrequencyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictFrequencyRollup): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictFrequencyRollupCodeLengthRule implements StrictFrequencyRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFrequencyRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict frequency rollup. */
export class StrictFrequencyRollupValidator {
  rules: StrictFrequencyRollupRule[];

  constructor(rules: StrictFrequencyRollupRule[]) {
    this.rules = rules;
  }

  validate(item: StrictFrequencyRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictFrequencyRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictFrequencyRollup[]): Map<string, string[]> {
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

export function defaultStrictFrequencyRollupValidator(): StrictFrequencyRollupValidator {
  return new StrictFrequencyRollupValidator(
    [
      new StrictFrequencyRollupRequiredCodeRule("strict frequency rollup needs a value"),
      new StrictFrequencyRollupApprovedGuardRule(0.3),
      new StrictFrequencyRollupRequiredCurrencyRule("strict frequency rollup needs this field"),
      new StrictFrequencyRollupDiscountRangeRule(5, 1233.6),
      new StrictFrequencyRollupCodeLengthRule(32),
    ],
  );
}
