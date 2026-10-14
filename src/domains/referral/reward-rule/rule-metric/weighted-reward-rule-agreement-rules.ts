import { WeightedRewardRuleAgreement } from "./weighted-reward-rule-agreement.js";

/** A rule a weighted reward rule agreement must pass. Check returns its problems, or none. */
export interface WeightedRewardRuleAgreementRule {
  check(item: WeightedRewardRuleAgreement): string[];
}

export class WeightedRewardRuleAgreementRequiredTitleRule implements WeightedRewardRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardRuleAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardRuleAgreementRevisionRangeRule implements WeightedRewardRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardRuleAgreement): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedRewardRuleAgreementRequiredReviewerRule implements WeightedRewardRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardRuleAgreement): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardRuleAgreementRequiredNameRule implements WeightedRewardRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardRuleAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted reward rule agreement. */
export class WeightedRewardRuleAgreementValidator {
  rules: WeightedRewardRuleAgreementRule[];

  constructor(rules: WeightedRewardRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardRuleAgreement): string[] {
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

  requireValid(item: WeightedRewardRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardRuleAgreement[]): Map<string, string[]> {
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

export function defaultWeightedRewardRuleAgreementValidator(): WeightedRewardRuleAgreementValidator {
  return new WeightedRewardRuleAgreementValidator(
    [
      new WeightedRewardRuleAgreementRequiredTitleRule("weighted reward rule agreement needs a value"),
      new WeightedRewardRuleAgreementRevisionRangeRule(1000, 3600),
      new WeightedRewardRuleAgreementRequiredReviewerRule("weighted reward rule agreement needs a value"),
      new WeightedRewardRuleAgreementRequiredNameRule("weighted reward rule agreement needs this field"),
    ],
  );
}
