import { WeightedBidRuleOverride } from "./weighted-bid-rule-override.js";

/** A rule a weighted bid rule override must pass. Check returns its problems, or none. */
export interface WeightedBidRuleOverrideRule {
  check(item: WeightedBidRuleOverride): string[];
}

export class WeightedBidRuleOverrideRequiredSummaryRule implements WeightedBidRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBidRuleOverride): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBidRuleOverrideRequiredLabelRule implements WeightedBidRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBidRuleOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBidRuleOverrideLabelLengthRule implements WeightedBidRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedBidRuleOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted bid rule override. */
export class WeightedBidRuleOverrideValidator {
  rules: WeightedBidRuleOverrideRule[];

  constructor(rules: WeightedBidRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedBidRuleOverride): string[] {
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

  requireValid(item: WeightedBidRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedBidRuleOverride[]): Map<string, string[]> {
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

export function defaultWeightedBidRuleOverrideValidator(): WeightedBidRuleOverrideValidator {
  return new WeightedBidRuleOverrideValidator(
    [
      new WeightedBidRuleOverrideRequiredSummaryRule("weighted bid rule override needs a value"),
      new WeightedBidRuleOverrideRequiredLabelRule("weighted bid rule override needs a value"),
      new WeightedBidRuleOverrideLabelLengthRule(86400),
    ],
  );
}
