import * as text from "../../../../kit/text.js";
import { BatchedInsightScore } from "./batched-insight-score.js";

/** A rule a batched insight score must pass. Check returns its problems, or none. */
export interface BatchedInsightScoreRule {
  check(item: BatchedInsightScore): string[];
}

export class BatchedInsightScoreAllowedCodeRule implements BatchedInsightScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedInsightScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class BatchedInsightScoreClicksRangeRule implements BatchedInsightScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedInsightScore): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedInsightScoreCodePrefixRule implements BatchedInsightScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedInsightScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedInsightScoreRequiredTitleRule implements BatchedInsightScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInsightScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInsightScoreTitleLengthRule implements BatchedInsightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedInsightScoreCodeLengthRule implements BatchedInsightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched insight score. */
export class BatchedInsightScoreValidator {
  rules: BatchedInsightScoreRule[];

  constructor(rules: BatchedInsightScoreRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInsightScore): string[] {
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

  requireValid(item: BatchedInsightScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInsightScore[]): Map<string, string[]> {
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

export function defaultBatchedInsightScoreValidator(): BatchedInsightScoreValidator {
  return new BatchedInsightScoreValidator(
    [
      new BatchedInsightScoreAllowedCodeRule([]),
      new BatchedInsightScoreClicksRangeRule(64, 64),
      new BatchedInsightScoreCodePrefixRule("Q"),
      new BatchedInsightScoreRequiredTitleRule("batched insight score needs this field"),
      new BatchedInsightScoreTitleLengthRule(80),
      new BatchedInsightScoreCodeLengthRule(80),
    ],
  );
}
