import { PendingRewardScore } from "./pending-reward-score.js";

/** A rule a pending reward score must pass. Check returns its problems, or none. */
export interface PendingRewardScoreRule {
  check(item: PendingRewardScore): string[];
}

export class PendingRewardScoreRequiredCodeRule implements PendingRewardScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardScoreSendAtRangeRule implements PendingRewardScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardScore): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRewardScoreCodeLengthRule implements PendingRewardScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardScoreImpressionsRangeRule implements PendingRewardScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardScore): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending reward score. */
export class PendingRewardScoreValidator {
  rules: PendingRewardScoreRule[];

  constructor(rules: PendingRewardScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardScore): string[] {
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

  requireValid(item: PendingRewardScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardScore[]): Map<string, string[]> {
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

export function defaultPendingRewardScoreValidator(): PendingRewardScoreValidator {
  return new PendingRewardScoreValidator(
    [
      new PendingRewardScoreRequiredCodeRule("pending reward score needs an entry"),
      new PendingRewardScoreSendAtRangeRule(80, 120),
      new PendingRewardScoreCodeLengthRule(1000),
      new PendingRewardScoreImpressionsRangeRule(120, 86400),
    ],
  );
}
