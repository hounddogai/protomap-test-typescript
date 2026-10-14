import { BidRuleThreshold } from "./bid-rule-threshold.js";

/** A rule a bid rule threshold must pass. Check returns its problems, or none. */
export interface BidRuleThresholdRule {
  check(item: BidRuleThreshold): string[];
}

export class BidRuleThresholdRequiredCampaignRefRule implements BidRuleThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleThreshold): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleThresholdTitleLengthRule implements BidRuleThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleThresholdAmountRangeRule implements BidRuleThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleThreshold): string[] {
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

export class BidRuleThresholdCodeLengthRule implements BidRuleThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleThresholdCodePrefixRule implements BidRuleThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleThresholdCostRangeRule implements BidRuleThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleThreshold): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a bid rule threshold. */
export class BidRuleThresholdValidator {
  rules: BidRuleThresholdRule[];

  constructor(rules: BidRuleThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleThreshold): string[] {
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

  requireValid(item: BidRuleThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleThreshold[]): Map<string, string[]> {
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

export function defaultBidRuleThresholdValidator(): BidRuleThresholdValidator {
  return new BidRuleThresholdValidator(
    [
      new BidRuleThresholdRequiredCampaignRefRule("bid rule threshold needs an entry"),
      new BidRuleThresholdTitleLengthRule(64),
      new BidRuleThresholdAmountRangeRule(5.5, 3713.5),
      new BidRuleThresholdCodeLengthRule(255),
      new BidRuleThresholdCodePrefixRule("X"),
      new BidRuleThresholdCostRangeRule(6.4, 4316.5),
    ],
  );
}
