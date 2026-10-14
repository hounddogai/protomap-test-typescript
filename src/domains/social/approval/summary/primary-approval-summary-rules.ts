import * as text from "../../../../kit/text.js";
import { PrimaryApprovalSummary } from "./primary-approval-summary.js";

/** A rule a primary approval summary must pass. Check returns its problems, or none. */
export interface PrimaryApprovalSummaryRule {
  check(item: PrimaryApprovalSummary): string[];
}

export class PrimaryApprovalSummaryAllowedCodeRule implements PrimaryApprovalSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryApprovalSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class PrimaryApprovalSummaryRequiredCodeRule implements PrimaryApprovalSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryApprovalSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryApprovalSummaryCodeLengthRule implements PrimaryApprovalSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryApprovalSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryApprovalSummaryDurationMinutesRangeRule implements PrimaryApprovalSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryApprovalSummary): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryApprovalSummaryRequiredLabelRule implements PrimaryApprovalSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryApprovalSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryApprovalSummaryBudgetRangeRule implements PrimaryApprovalSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryApprovalSummary): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary approval summary. */
export class PrimaryApprovalSummaryValidator {
  rules: PrimaryApprovalSummaryRule[];

  constructor(rules: PrimaryApprovalSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryApprovalSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryApprovalSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryApprovalSummary[]): Map<string, string[]> {
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

export function defaultPrimaryApprovalSummaryValidator(): PrimaryApprovalSummaryValidator {
  return new PrimaryApprovalSummaryValidator(
    [
      new PrimaryApprovalSummaryAllowedCodeRule(["default", "default", "capped"]),
      new PrimaryApprovalSummaryRequiredCodeRule("primary approval summary needs an entry"),
      new PrimaryApprovalSummaryCodeLengthRule(120),
      new PrimaryApprovalSummaryDurationMinutesRangeRule(64, 64),
      new PrimaryApprovalSummaryRequiredLabelRule("primary approval summary needs an entry"),
      new PrimaryApprovalSummaryBudgetRangeRule(0.7, 2853.6),
    ],
  );
}
