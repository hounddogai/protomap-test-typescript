import * as text from "../../../../kit/text.js";
import { RewardRuleEstimate } from "./reward-rule-estimate.js";

/** A rule a reward rule estimate must pass. Check returns its problems, or none. */
export interface RewardRuleEstimateRule {
  check(item: RewardRuleEstimate): string[];
}

export class RewardRuleEstimateCodeLengthRule implements RewardRuleEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleEstimateAllowedCodeRule implements RewardRuleEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class RewardRuleEstimateFrequencyCapRangeRule implements RewardRuleEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleEstimate): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleEstimateRequiredNameRule implements RewardRuleEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleEstimateVisibleGuardRule implements RewardRuleEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardRuleEstimate): string[] {
    if (item.visible && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a reward rule estimate. */
export class RewardRuleEstimateValidator {
  rules: RewardRuleEstimateRule[];

  constructor(rules: RewardRuleEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleEstimate): string[] {
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

  requireValid(item: RewardRuleEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleEstimate[]): Map<string, string[]> {
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

export function defaultRewardRuleEstimateValidator(): RewardRuleEstimateValidator {
  return new RewardRuleEstimateValidator(
    [
      new RewardRuleEstimateCodeLengthRule(1000),
      new RewardRuleEstimateAllowedCodeRule([]),
      new RewardRuleEstimateFrequencyCapRangeRule(16, 80),
      new RewardRuleEstimateRequiredNameRule("reward rule estimate needs a value"),
      new RewardRuleEstimateVisibleGuardRule(3600),
    ],
  );
}
