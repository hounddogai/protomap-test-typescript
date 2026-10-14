import { BidRuleRecord } from "./bid-rule-record.js";

/** A rule a bid rule record must pass. Check returns its problems, or none. */
export interface BidRuleRecordRule {
  check(item: BidRuleRecord): string[];
}

export class BidRuleRecordTitleLengthRule implements BidRuleRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleRecordWeightRangeRule implements BidRuleRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleRecord): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleRecordCodeLengthRule implements BidRuleRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule record. */
export class BidRuleRecordValidator {
  rules: BidRuleRecordRule[];

  constructor(rules: BidRuleRecordRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleRecord[]): Map<string, string[]> {
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

export function defaultBidRuleRecordValidator(): BidRuleRecordValidator {
  return new BidRuleRecordValidator(
    [
      new BidRuleRecordTitleLengthRule(86400),
      new BidRuleRecordWeightRangeRule(1.1, 3819.2),
      new BidRuleRecordCodeLengthRule(86400),
    ],
  );
}
