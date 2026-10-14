import * as text from "../../../../kit/text.js";
import { PendingBranchBaseline } from "./pending-branch-baseline.js";

/** A rule a pending branch baseline must pass. Check returns its problems, or none. */
export interface PendingBranchBaselineRule {
  check(item: PendingBranchBaseline): string[];
}

export class PendingBranchBaselineRequiredCodeRule implements PendingBranchBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBranchBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBranchBaselineContactEmailLengthRule implements PendingBranchBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBranchBaseline): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBranchBaselineRequiredLabelRule implements PendingBranchBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBranchBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBranchBaselineMarginRangeRule implements PendingBranchBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBranchBaseline): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBranchBaselineRequiredContactEmailRule implements PendingBranchBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBranchBaseline): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBranchBaselineAllowedLabelRule implements PendingBranchBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingBranchBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

/** Runs every rule of a pending branch baseline. */
export class PendingBranchBaselineValidator {
  rules: PendingBranchBaselineRule[];

  constructor(rules: PendingBranchBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBranchBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBranchBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBranchBaseline[]): Map<string, string[]> {
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

export function defaultPendingBranchBaselineValidator(): PendingBranchBaselineValidator {
  return new PendingBranchBaselineValidator(
    [
      new PendingBranchBaselineRequiredCodeRule("pending branch baseline needs this field"),
      new PendingBranchBaselineContactEmailLengthRule(16),
      new PendingBranchBaselineRequiredLabelRule("pending branch baseline needs a value"),
      new PendingBranchBaselineMarginRangeRule(8.8, 530.3),
      new PendingBranchBaselineRequiredContactEmailRule("pending branch baseline needs an entry"),
      new PendingBranchBaselineAllowedLabelRule(["weighted", "primary"]),
    ],
  );
}
