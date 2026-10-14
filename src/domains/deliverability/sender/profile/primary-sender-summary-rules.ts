import * as text from "../../../../kit/text.js";
import { PrimarySenderSummary } from "./primary-sender-summary.js";

/** A rule a primary sender summary must pass. Check returns its problems, or none. */
export interface PrimarySenderSummaryRule {
  check(item: PrimarySenderSummary): string[];
}

export class PrimarySenderSummaryCodeLengthRule implements PrimarySenderSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySenderSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySenderSummaryRequiredCodeRule implements PrimarySenderSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySenderSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySenderSummaryAllowedUtmSourceRule implements PrimarySenderSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimarySenderSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is too long`];
    return [];
  }
}

/** Runs every rule of a primary sender summary. */
export class PrimarySenderSummaryValidator {
  rules: PrimarySenderSummaryRule[];

  constructor(rules: PrimarySenderSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySenderSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySenderSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySenderSummary[]): Map<string, string[]> {
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

export function defaultPrimarySenderSummaryValidator(): PrimarySenderSummaryValidator {
  return new PrimarySenderSummaryValidator(
    [
      new PrimarySenderSummaryCodeLengthRule(64),
      new PrimarySenderSummaryRequiredCodeRule("primary sender summary needs this field"),
      new PrimarySenderSummaryAllowedUtmSourceRule(["weighted", "strict", "tiered"]),
    ],
  );
}
