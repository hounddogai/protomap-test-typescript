import * as text from "../../../../kit/text.js";
import { PendingCreativeSummary } from "./pending-creative-summary.js";

/** A rule a pending creative summary must pass. Check returns its problems, or none. */
export interface PendingCreativeSummaryRule {
  check(item: PendingCreativeSummary): string[];
}

export class PendingCreativeSummaryRequiredTitleRule implements PendingCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCreativeSummaryCodeLengthRule implements PendingCreativeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCreativeSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCreativeSummaryRequiredLabelRule implements PendingCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCreativeSummaryQuantityRangeRule implements PendingCreativeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCreativeSummary): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingCreativeSummaryAllowedReviewerRule implements PendingCreativeSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingCreativeSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is duplicated`];
    return [];
  }
}

/** Runs every rule of a pending creative summary. */
export class PendingCreativeSummaryValidator {
  rules: PendingCreativeSummaryRule[];

  constructor(rules: PendingCreativeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCreativeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingCreativeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCreativeSummary[]): Map<string, string[]> {
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

export function defaultPendingCreativeSummaryValidator(): PendingCreativeSummaryValidator {
  return new PendingCreativeSummaryValidator(
    [
      new PendingCreativeSummaryRequiredTitleRule("pending creative summary needs a value"),
      new PendingCreativeSummaryCodeLengthRule(1000),
      new PendingCreativeSummaryRequiredLabelRule("pending creative summary needs a value"),
      new PendingCreativeSummaryQuantityRangeRule(32, 1000),
      new PendingCreativeSummaryAllowedReviewerRule([]),
    ],
  );
}
