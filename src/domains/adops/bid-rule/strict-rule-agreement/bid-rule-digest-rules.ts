import { BidRuleDigest } from "./bid-rule-digest.js";

/** A rule a bid rule digest must pass. Check returns its problems, or none. */
export interface BidRuleDigestRule {
  check(item: BidRuleDigest): string[];
}

export class BidRuleDigestOpenRateRangeRule implements BidRuleDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleDigest): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleDigestFrequencyCapRangeRule implements BidRuleDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleDigest): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleDigestRequiredTitleRule implements BidRuleDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleDigestRequiredCodeRule implements BidRuleDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleDigestCodeLengthRule implements BidRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleDigestTitleLengthRule implements BidRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule digest. */
export class BidRuleDigestValidator {
  rules: BidRuleDigestRule[];

  constructor(rules: BidRuleDigestRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleDigest[]): Map<string, string[]> {
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

export function defaultBidRuleDigestValidator(): BidRuleDigestValidator {
  return new BidRuleDigestValidator(
    [
      new BidRuleDigestOpenRateRangeRule(7.7, 898.7),
      new BidRuleDigestFrequencyCapRangeRule(16, 16),
      new BidRuleDigestRequiredTitleRule("bid rule digest needs this field"),
      new BidRuleDigestRequiredCodeRule("bid rule digest needs an entry"),
      new BidRuleDigestCodeLengthRule(120),
      new BidRuleDigestTitleLengthRule(80),
    ],
  );
}
