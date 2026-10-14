import { BidRuleBundle } from "./bid-rule-bundle.js";

/** A rule a bid rule bundle must pass. Check returns its problems, or none. */
export interface BidRuleBundleRule {
  check(item: BidRuleBundle): string[];
}

export class BidRuleBundleRequiredLabelRule implements BidRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleBundleCodeLengthRule implements BidRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleBundleLabelLengthRule implements BidRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleBundleRequiredCohortRule implements BidRuleBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleBundle): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleBundleScoreRangeRule implements BidRuleBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleBundle): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleBundleNotesLengthRule implements BidRuleBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleBundle): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule bundle. */
export class BidRuleBundleValidator {
  rules: BidRuleBundleRule[];

  constructor(rules: BidRuleBundleRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleBundle[]): Map<string, string[]> {
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

export function defaultBidRuleBundleValidator(): BidRuleBundleValidator {
  return new BidRuleBundleValidator(
    [
      new BidRuleBundleRequiredLabelRule("bid rule bundle needs an entry"),
      new BidRuleBundleCodeLengthRule(86400),
      new BidRuleBundleLabelLengthRule(86400),
      new BidRuleBundleRequiredCohortRule("bid rule bundle needs this field"),
      new BidRuleBundleScoreRangeRule(2.9, 4879.1),
      new BidRuleBundleNotesLengthRule(80),
    ],
  );
}
