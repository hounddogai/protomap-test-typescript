import * as text from "../../../../kit/text.js";
import { BatchedCreditRule } from "./batched-credit-rule.js";

/** A rule a batched credit rule must pass. Check returns its problems, or none. */
export interface BatchedCreditRuleRule {
  check(item: BatchedCreditRule): string[];
}

export class BatchedCreditRuleRetriesRangeRule implements BatchedCreditRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreditRule): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedCreditRuleSendAtRangeRule implements BatchedCreditRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreditRule): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedCreditRuleAllowedCodeRule implements BatchedCreditRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedCreditRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class BatchedCreditRuleTitleLengthRule implements BatchedCreditRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCreditRuleGraceDaysRangeRule implements BatchedCreditRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreditRule): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedCreditRuleSegmentLengthRule implements BatchedCreditRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditRule): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched credit rule. */
export class BatchedCreditRuleValidator {
  rules: BatchedCreditRuleRule[];

  constructor(rules: BatchedCreditRuleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCreditRule): string[] {
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

  requireValid(item: BatchedCreditRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCreditRule[]): Map<string, string[]> {
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

export function defaultBatchedCreditRuleValidator(): BatchedCreditRuleValidator {
  return new BatchedCreditRuleValidator(
    [
      new BatchedCreditRuleRetriesRangeRule(64, 120),
      new BatchedCreditRuleSendAtRangeRule(64, 1000),
      new BatchedCreditRuleAllowedCodeRule(["capped"]),
      new BatchedCreditRuleTitleLengthRule(86400),
      new BatchedCreditRuleGraceDaysRangeRule(80, 1000),
      new BatchedCreditRuleSegmentLengthRule(16),
    ],
  );
}
