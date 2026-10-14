import * as text from "../../../../kit/text.js";
import { RewardEstimate } from "./reward-estimate.js";

/** A rule a reward estimate must pass. Check returns its problems, or none. */
export interface RewardEstimateRule {
  check(item: RewardEstimate): string[];
}

export class RewardEstimateCodeLengthRule implements RewardEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardEstimateAllowedCodeRule implements RewardEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class RewardEstimateCodePrefixRule implements RewardEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardEstimateRequiredTitleRule implements RewardEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardEstimateScoreRangeRule implements RewardEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardEstimate): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward estimate. */
export class RewardEstimateValidator {
  rules: RewardEstimateRule[];

  constructor(rules: RewardEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: RewardEstimate): string[] {
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

  requireValid(item: RewardEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardEstimate[]): Map<string, string[]> {
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

export function defaultRewardEstimateValidator(): RewardEstimateValidator {
  return new RewardEstimateValidator(
    [
      new RewardEstimateCodeLengthRule(86400),
      new RewardEstimateAllowedCodeRule(["lenient", "regional", "weighted"]),
      new RewardEstimateCodePrefixRule("REF"),
      new RewardEstimateRequiredTitleRule("reward estimate needs an entry"),
      new RewardEstimateScoreRangeRule(1.8, 139.8),
    ],
  );
}
