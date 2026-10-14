import { BidRuleMilestone } from "./bid-rule-milestone.js";

/** A rule a bid rule milestone must pass. Check returns its problems, or none. */
export interface BidRuleMilestoneRule {
  check(item: BidRuleMilestone): string[];
}

export class BidRuleMilestoneRequiredLabelRule implements BidRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleMilestoneRequiredChecksumRule implements BidRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleMilestone): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleMilestoneRequiredReviewerRule implements BidRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleMilestone): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleMilestoneDiscountRangeRule implements BidRuleMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleMilestone): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleMilestoneMaximumRangeRule implements BidRuleMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleMilestone): string[] {
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

/** Runs every rule of a bid rule milestone. */
export class BidRuleMilestoneValidator {
  rules: BidRuleMilestoneRule[];

  constructor(rules: BidRuleMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleMilestone[]): Map<string, string[]> {
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

export function defaultBidRuleMilestoneValidator(): BidRuleMilestoneValidator {
  return new BidRuleMilestoneValidator(
    [
      new BidRuleMilestoneRequiredLabelRule("bid rule milestone needs this field"),
      new BidRuleMilestoneRequiredChecksumRule("bid rule milestone needs an entry"),
      new BidRuleMilestoneRequiredReviewerRule("bid rule milestone needs a value"),
      new BidRuleMilestoneDiscountRangeRule(0.2, 1356.3),
      new BidRuleMilestoneMaximumRangeRule(2.9, 4104.7),
    ],
  );
}
