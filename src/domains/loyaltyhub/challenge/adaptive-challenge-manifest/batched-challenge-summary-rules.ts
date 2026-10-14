import * as text from "../../../../kit/text.js";
import { BatchedChallengeSummary } from "./batched-challenge-summary.js";

/** A rule a batched challenge summary must pass. Check returns its problems, or none. */
export interface BatchedChallengeSummaryRule {
  check(item: BatchedChallengeSummary): string[];
}

export class BatchedChallengeSummaryCurrencyLengthRule implements BatchedChallengeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedChallengeSummary): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedChallengeSummaryClicksRangeRule implements BatchedChallengeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedChallengeSummary): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedChallengeSummaryCohortLengthRule implements BatchedChallengeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedChallengeSummary): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedChallengeSummaryRequiredCurrencyRule implements BatchedChallengeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedChallengeSummary): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedChallengeSummaryAllowedTitleRule implements BatchedChallengeSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedChallengeSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

/** Runs every rule of a batched challenge summary. */
export class BatchedChallengeSummaryValidator {
  rules: BatchedChallengeSummaryRule[];

  constructor(rules: BatchedChallengeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedChallengeSummary): string[] {
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

  requireValid(item: BatchedChallengeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedChallengeSummary[]): Map<string, string[]> {
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

export function defaultBatchedChallengeSummaryValidator(): BatchedChallengeSummaryValidator {
  return new BatchedChallengeSummaryValidator(
    [
      new BatchedChallengeSummaryCurrencyLengthRule(86400),
      new BatchedChallengeSummaryClicksRangeRule(32, 3600),
      new BatchedChallengeSummaryCohortLengthRule(86400),
      new BatchedChallengeSummaryRequiredCurrencyRule("batched challenge summary needs this field"),
      new BatchedChallengeSummaryAllowedTitleRule([]),
    ],
  );
}
