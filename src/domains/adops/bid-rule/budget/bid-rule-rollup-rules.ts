import { BidRuleRollup } from "./bid-rule-rollup.js";

/** A rule a bid rule rollup must pass. Check returns its problems, or none. */
export interface BidRuleRollupRule {
  check(item: BidRuleRollup): string[];
}

export class BidRuleRollupMinimumRangeRule implements BidRuleRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleRollup): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleRollupCodePrefixRule implements BidRuleRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleRollupRequiredLabelRule implements BidRuleRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule rollup. */
export class BidRuleRollupValidator {
  rules: BidRuleRollupRule[];

  constructor(rules: BidRuleRollupRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleRollup[]): Map<string, string[]> {
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

export function defaultBidRuleRollupValidator(): BidRuleRollupValidator {
  return new BidRuleRollupValidator(
    [
      new BidRuleRollupMinimumRangeRule(3.5, 783.2),
      new BidRuleRollupCodePrefixRule("OPS"),
      new BidRuleRollupRequiredLabelRule("bid rule rollup needs an entry"),
    ],
  );
}
