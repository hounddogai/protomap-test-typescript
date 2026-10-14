import * as text from "../../../../kit/text.js";
import { ApprovalSummary } from "./approval-summary.js";

/** A rule a approval summary must pass. Check returns its problems, or none. */
export interface ApprovalSummaryRule {
  check(item: ApprovalSummary): string[];
}

export class ApprovalSummaryAllowedCodeRule implements ApprovalSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class ApprovalSummaryCodeLengthRule implements ApprovalSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalSummaryRequiredLocaleRule implements ApprovalSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalSummaryDurationMinutesRangeRule implements ApprovalSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalSummary): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalSummaryTitleLengthRule implements ApprovalSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval summary. */
export class ApprovalSummaryValidator {
  rules: ApprovalSummaryRule[];

  constructor(rules: ApprovalSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalSummary): string[] {
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

  requireValid(item: ApprovalSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalSummary[]): Map<string, string[]> {
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

export function defaultApprovalSummaryValidator(): ApprovalSummaryValidator {
  return new ApprovalSummaryValidator(
    [
      new ApprovalSummaryAllowedCodeRule([]),
      new ApprovalSummaryCodeLengthRule(32),
      new ApprovalSummaryRequiredLocaleRule("approval summary needs this field"),
      new ApprovalSummaryDurationMinutesRangeRule(120, 86400),
      new ApprovalSummaryTitleLengthRule(86400),
    ],
  );
}
