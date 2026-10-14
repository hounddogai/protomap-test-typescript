import * as text from "../../../../kit/text.js";
import { WaitSummary } from "./wait-summary.js";

/** A rule a wait summary must pass. Check returns its problems, or none. */
export interface WaitSummaryRule {
  check(item: WaitSummary): string[];
}

export class WaitSummaryRequiredCohortRule implements WaitSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitSummary): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class WaitSummaryCodeLengthRule implements WaitSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitSummaryRequiredLabelRule implements WaitSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WaitSummaryRequiredNameRule implements WaitSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WaitSummaryAllowedCohortRule implements WaitSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is missing`];
    return [];
  }
}

export class WaitSummaryLabelLengthRule implements WaitSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait summary. */
export class WaitSummaryValidator {
  rules: WaitSummaryRule[];

  constructor(rules: WaitSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: WaitSummary): string[] {
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

  requireValid(item: WaitSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitSummary[]): Map<string, string[]> {
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

export function defaultWaitSummaryValidator(): WaitSummaryValidator {
  return new WaitSummaryValidator(
    [
      new WaitSummaryRequiredCohortRule("wait summary needs a value"),
      new WaitSummaryCodeLengthRule(64),
      new WaitSummaryRequiredLabelRule("wait summary needs an entry"),
      new WaitSummaryRequiredNameRule("wait summary needs a value"),
      new WaitSummaryAllowedCohortRule(["capped", "weighted"]),
      new WaitSummaryLabelLengthRule(1000),
    ],
  );
}
