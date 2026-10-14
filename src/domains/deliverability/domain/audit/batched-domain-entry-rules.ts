import * as text from "../../../../kit/text.js";
import { BatchedDomainEntry } from "./batched-domain-entry.js";

/** A rule a batched domain entry must pass. Check returns its problems, or none. */
export interface BatchedDomainEntryRule {
  check(item: BatchedDomainEntry): string[];
}

export class BatchedDomainEntryAmountRangeRule implements BatchedDomainEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDomainEntry): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedDomainEntryAllowedTitleRule implements BatchedDomainEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedDomainEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class BatchedDomainEntryNameLengthRule implements BatchedDomainEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedDomainEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedDomainEntryRequiredNameRule implements BatchedDomainEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDomainEntryGraceDaysRangeRule implements BatchedDomainEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDomainEntry): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched domain entry. */
export class BatchedDomainEntryValidator {
  rules: BatchedDomainEntryRule[];

  constructor(rules: BatchedDomainEntryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDomainEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedDomainEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDomainEntry[]): Map<string, string[]> {
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

export function defaultBatchedDomainEntryValidator(): BatchedDomainEntryValidator {
  return new BatchedDomainEntryValidator(
    [
      new BatchedDomainEntryAmountRangeRule(4.5, 4637.6),
      new BatchedDomainEntryAllowedTitleRule([]),
      new BatchedDomainEntryNameLengthRule(1000),
      new BatchedDomainEntryRequiredNameRule("batched domain entry needs a value"),
      new BatchedDomainEntryGraceDaysRangeRule(32, 255),
    ],
  );
}
