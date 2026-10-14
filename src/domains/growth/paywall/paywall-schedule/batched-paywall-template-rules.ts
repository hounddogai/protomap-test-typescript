import * as text from "../../../../kit/text.js";
import { BatchedPaywallTemplate } from "./batched-paywall-template.js";

/** A rule a batched paywall template must pass. Check returns its problems, or none. */
export interface BatchedPaywallTemplateRule {
  check(item: BatchedPaywallTemplate): string[];
}

export class BatchedPaywallTemplateAllowedTitleRule implements BatchedPaywallTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPaywallTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class BatchedPaywallTemplateTitleLengthRule implements BatchedPaywallTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPaywallTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPaywallTemplateGraceDaysRangeRule implements BatchedPaywallTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPaywallTemplate): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched paywall template. */
export class BatchedPaywallTemplateValidator {
  rules: BatchedPaywallTemplateRule[];

  constructor(rules: BatchedPaywallTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPaywallTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPaywallTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPaywallTemplate[]): Map<string, string[]> {
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

export function defaultBatchedPaywallTemplateValidator(): BatchedPaywallTemplateValidator {
  return new BatchedPaywallTemplateValidator(
    [
      new BatchedPaywallTemplateAllowedTitleRule([]),
      new BatchedPaywallTemplateTitleLengthRule(1000),
      new BatchedPaywallTemplateGraceDaysRangeRule(80, 3600),
    ],
  );
}
