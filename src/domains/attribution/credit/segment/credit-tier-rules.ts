import { CreditTier } from "./credit-tier.js";

/** A rule a credit tier must pass. Check returns its problems, or none. */
export interface CreditTierRule {
  check(item: CreditTier): string[];
}

export class CreditTierCodePrefixRule implements CreditTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditTierCodeLengthRule implements CreditTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditTierRequiredCodeRule implements CreditTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditTierLabelLengthRule implements CreditTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditTierRetriesRangeRule implements CreditTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditTier): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditTierMaximumRangeRule implements CreditTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditTier): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a credit tier. */
export class CreditTierValidator {
  rules: CreditTierRule[];

  constructor(rules: CreditTierRule[]) {
    this.rules = rules;
  }

  validate(item: CreditTier): string[] {
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

  requireValid(item: CreditTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditTier[]): Map<string, string[]> {
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

export function defaultCreditTierValidator(): CreditTierValidator {
  return new CreditTierValidator(
    [
      new CreditTierCodePrefixRule("REF"),
      new CreditTierCodeLengthRule(16),
      new CreditTierRequiredCodeRule("credit tier needs an entry"),
      new CreditTierLabelLengthRule(255),
      new CreditTierRetriesRangeRule(64, 64),
      new CreditTierMaximumRangeRule(1.7, 3206.6),
    ],
  );
}
