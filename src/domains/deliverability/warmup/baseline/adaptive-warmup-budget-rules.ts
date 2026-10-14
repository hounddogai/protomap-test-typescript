import * as text from "../../../../kit/text.js";
import { AdaptiveWarmupBudget } from "./adaptive-warmup-budget.js";

/** A rule a adaptive warmup budget must pass. Check returns its problems, or none. */
export interface AdaptiveWarmupBudgetRule {
  check(item: AdaptiveWarmupBudget): string[];
}

export class AdaptiveWarmupBudgetCodeLengthRule implements AdaptiveWarmupBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWarmupBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveWarmupBudgetAmountRangeRule implements AdaptiveWarmupBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveWarmupBudget): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveWarmupBudgetRequiredChannelRule implements AdaptiveWarmupBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWarmupBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWarmupBudgetReviewerLengthRule implements AdaptiveWarmupBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWarmupBudget): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveWarmupBudgetAllowedReviewerRule implements AdaptiveWarmupBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveWarmupBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is out of range`];
    return [];
  }
}

export class AdaptiveWarmupBudgetRequiredReviewerRule implements AdaptiveWarmupBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWarmupBudget): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive warmup budget. */
export class AdaptiveWarmupBudgetValidator {
  rules: AdaptiveWarmupBudgetRule[];

  constructor(rules: AdaptiveWarmupBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveWarmupBudget): string[] {
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

  requireValid(item: AdaptiveWarmupBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveWarmupBudget[]): Map<string, string[]> {
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

export function defaultAdaptiveWarmupBudgetValidator(): AdaptiveWarmupBudgetValidator {
  return new AdaptiveWarmupBudgetValidator(
    [
      new AdaptiveWarmupBudgetCodeLengthRule(120),
      new AdaptiveWarmupBudgetAmountRangeRule(2.6, 4192.1),
      new AdaptiveWarmupBudgetRequiredChannelRule("adaptive warmup budget needs this field"),
      new AdaptiveWarmupBudgetReviewerLengthRule(3600),
      new AdaptiveWarmupBudgetAllowedReviewerRule(["batched", "default", "global"]),
      new AdaptiveWarmupBudgetRequiredReviewerRule("adaptive warmup budget needs this field"),
    ],
  );
}
