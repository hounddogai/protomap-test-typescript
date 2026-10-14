import * as text from "../../../../kit/text.js";
import { CreditSummary } from "./credit-summary.js";

/** A rule a credit summary must pass. Check returns its problems, or none. */
export interface CreditSummaryRule {
  check(item: CreditSummary): string[];
}

export class CreditSummaryAllowedCodeRule implements CreditSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class CreditSummaryCodeLengthRule implements CreditSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditSummaryDescriptionLengthRule implements CreditSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSummary): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditSummaryNameLengthRule implements CreditSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit summary. */
export class CreditSummaryValidator {
  rules: CreditSummaryRule[];

  constructor(rules: CreditSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: CreditSummary): string[] {
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

  requireValid(item: CreditSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditSummary[]): Map<string, string[]> {
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

export function defaultCreditSummaryValidator(): CreditSummaryValidator {
  return new CreditSummaryValidator(
    [
      new CreditSummaryAllowedCodeRule(["adaptive", "batched", "tiered"]),
      new CreditSummaryCodeLengthRule(86400),
      new CreditSummaryDescriptionLengthRule(120),
      new CreditSummaryNameLengthRule(80),
    ],
  );
}
