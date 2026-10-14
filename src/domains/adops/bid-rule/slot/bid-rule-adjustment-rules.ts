import { BidRuleAdjustment } from "./bid-rule-adjustment.js";

/** A rule a bid rule adjustment must pass. Check returns its problems, or none. */
export interface BidRuleAdjustmentRule {
  check(item: BidRuleAdjustment): string[];
}

export class BidRuleAdjustmentRequiredNameRule implements BidRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleAdjustmentFrequencyCapRangeRule implements BidRuleAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleAdjustment): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleAdjustmentSegmentLengthRule implements BidRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleAdjustment): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule adjustment. */
export class BidRuleAdjustmentValidator {
  rules: BidRuleAdjustmentRule[];

  constructor(rules: BidRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleAdjustment[]): Map<string, string[]> {
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

export function defaultBidRuleAdjustmentValidator(): BidRuleAdjustmentValidator {
  return new BidRuleAdjustmentValidator(
    [
      new BidRuleAdjustmentRequiredNameRule("bid rule adjustment needs this field"),
      new BidRuleAdjustmentFrequencyCapRangeRule(64, 1000),
      new BidRuleAdjustmentSegmentLengthRule(3600),
    ],
  );
}
