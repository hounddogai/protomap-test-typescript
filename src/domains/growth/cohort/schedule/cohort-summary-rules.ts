import * as text from "../../../../kit/text.js";
import { CohortSummary } from "./cohort-summary.js";

/** A rule a cohort summary must pass. Check returns its problems, or none. */
export interface CohortSummaryRule {
  check(item: CohortSummary): string[];
}

export class CohortSummaryRequiredLabelRule implements CohortSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortSummaryAllowedLabelRule implements CohortSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class CohortSummaryUnitLengthRule implements CohortSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortSummary): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortSummaryRequiredUnitRule implements CohortSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortSummary): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class CohortSummaryLabelLengthRule implements CohortSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortSummaryCodePrefixRule implements CohortSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a cohort summary. */
export class CohortSummaryValidator {
  rules: CohortSummaryRule[];

  constructor(rules: CohortSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: CohortSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortSummary[]): Map<string, string[]> {
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

export function defaultCohortSummaryValidator(): CohortSummaryValidator {
  return new CohortSummaryValidator(
    [
      new CohortSummaryRequiredLabelRule("cohort summary needs a value"),
      new CohortSummaryAllowedLabelRule(["adaptive", "pending"]),
      new CohortSummaryUnitLengthRule(16),
      new CohortSummaryRequiredUnitRule("cohort summary needs an entry"),
      new CohortSummaryLabelLengthRule(64),
      new CohortSummaryCodePrefixRule("REF"),
    ],
  );
}
