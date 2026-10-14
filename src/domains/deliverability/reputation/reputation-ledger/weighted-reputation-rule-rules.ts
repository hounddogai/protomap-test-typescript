import { WeightedReputationRule } from "./weighted-reputation-rule.js";

/** A rule a weighted reputation rule must pass. Check returns its problems, or none. */
export interface WeightedReputationRuleRule {
  check(item: WeightedReputationRule): string[];
}

export class WeightedReputationRuleCodeLengthRule implements WeightedReputationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReputationRuleRateRangeRule implements WeightedReputationRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedReputationRule): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedReputationRuleRequiredSummaryRule implements WeightedReputationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationRule): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted reputation rule. */
export class WeightedReputationRuleValidator {
  rules: WeightedReputationRuleRule[];

  constructor(rules: WeightedReputationRuleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReputationRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedReputationRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReputationRule[]): Map<string, string[]> {
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

export function defaultWeightedReputationRuleValidator(): WeightedReputationRuleValidator {
  return new WeightedReputationRuleValidator(
    [
      new WeightedReputationRuleCodeLengthRule(86400),
      new WeightedReputationRuleRateRangeRule(7.1, 3781.4),
      new WeightedReputationRuleRequiredSummaryRule("weighted reputation rule needs an entry"),
    ],
  );
}
