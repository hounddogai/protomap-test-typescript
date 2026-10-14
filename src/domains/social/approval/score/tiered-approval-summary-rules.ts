import * as text from "../../../../kit/text.js";
import { TieredApprovalSummary } from "./tiered-approval-summary.js";

/** A rule a tiered approval summary must pass. Check returns its problems, or none. */
export interface TieredApprovalSummaryRule {
  check(item: TieredApprovalSummary): string[];
}

export class TieredApprovalSummaryCodeLengthRule implements TieredApprovalSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredApprovalSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredApprovalSummaryRequiredExternalRefRule implements TieredApprovalSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredApprovalSummary): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredApprovalSummaryWindowDaysRangeRule implements TieredApprovalSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredApprovalSummary): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredApprovalSummaryAllowedExternalRefRule implements TieredApprovalSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredApprovalSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

/** Runs every rule of a tiered approval summary. */
export class TieredApprovalSummaryValidator {
  rules: TieredApprovalSummaryRule[];

  constructor(rules: TieredApprovalSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredApprovalSummary): string[] {
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

  requireValid(item: TieredApprovalSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredApprovalSummary[]): Map<string, string[]> {
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

export function defaultTieredApprovalSummaryValidator(): TieredApprovalSummaryValidator {
  return new TieredApprovalSummaryValidator(
    [
      new TieredApprovalSummaryCodeLengthRule(80),
      new TieredApprovalSummaryRequiredExternalRefRule("tiered approval summary needs a value"),
      new TieredApprovalSummaryWindowDaysRangeRule(16, 80),
      new TieredApprovalSummaryAllowedExternalRefRule(["manual"]),
    ],
  );
}
