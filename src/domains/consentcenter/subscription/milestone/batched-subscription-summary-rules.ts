import * as text from "../../../../kit/text.js";
import { BatchedSubscriptionSummary } from "./batched-subscription-summary.js";

/** A rule a batched subscription summary must pass. Check returns its problems, or none. */
export interface BatchedSubscriptionSummaryRule {
  check(item: BatchedSubscriptionSummary): string[];
}

export class BatchedSubscriptionSummaryRequiredAudienceIdRule implements BatchedSubscriptionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSubscriptionSummary): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSubscriptionSummaryRequiredCodeRule implements BatchedSubscriptionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSubscriptionSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSubscriptionSummaryAudienceIdLengthRule implements BatchedSubscriptionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSubscriptionSummary): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedSubscriptionSummaryAllowedLabelRule implements BatchedSubscriptionSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedSubscriptionSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class BatchedSubscriptionSummaryLabelLengthRule implements BatchedSubscriptionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSubscriptionSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedSubscriptionSummaryCodePrefixRule implements BatchedSubscriptionSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedSubscriptionSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched subscription summary. */
export class BatchedSubscriptionSummaryValidator {
  rules: BatchedSubscriptionSummaryRule[];

  constructor(rules: BatchedSubscriptionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSubscriptionSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedSubscriptionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSubscriptionSummary[]): Map<string, string[]> {
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

export function defaultBatchedSubscriptionSummaryValidator(): BatchedSubscriptionSummaryValidator {
  return new BatchedSubscriptionSummaryValidator(
    [
      new BatchedSubscriptionSummaryRequiredAudienceIdRule("batched subscription summary needs this field"),
      new BatchedSubscriptionSummaryRequiredCodeRule("batched subscription summary needs a value"),
      new BatchedSubscriptionSummaryAudienceIdLengthRule(86400),
      new BatchedSubscriptionSummaryAllowedLabelRule([]),
      new BatchedSubscriptionSummaryLabelLengthRule(120),
      new BatchedSubscriptionSummaryCodePrefixRule("Q"),
    ],
  );
}
