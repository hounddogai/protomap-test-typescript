import { RedemptionTier } from "./redemption-tier.js";

/** A rule a redemption tier must pass. Check returns its problems, or none. */
export interface RedemptionTierRule {
  check(item: RedemptionTier): string[];
}

export class RedemptionTierCodeLengthRule implements RedemptionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionTierRequiredCodeRule implements RedemptionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionTierSequenceRangeRule implements RedemptionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionTier): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RedemptionTierPhoneLengthRule implements RedemptionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionTier): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption tier. */
export class RedemptionTierValidator {
  rules: RedemptionTierRule[];

  constructor(rules: RedemptionTierRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionTier): string[] {
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

  requireValid(item: RedemptionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionTier[]): Map<string, string[]> {
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

export function defaultRedemptionTierValidator(): RedemptionTierValidator {
  return new RedemptionTierValidator(
    [
      new RedemptionTierCodeLengthRule(1000),
      new RedemptionTierRequiredCodeRule("redemption tier needs this field"),
      new RedemptionTierSequenceRangeRule(16, 1000),
      new RedemptionTierPhoneLengthRule(64),
    ],
  );
}
