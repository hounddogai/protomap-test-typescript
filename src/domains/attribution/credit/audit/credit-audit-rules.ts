import * as text from "../../../../kit/text.js";
import { CreditAudit } from "./credit-audit.js";

/** A rule a credit audit must pass. Check returns its problems, or none. */
export interface CreditAuditRule {
  check(item: CreditAudit): string[];
}

export class CreditAuditAllowedReviewerRule implements CreditAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is below minimum`];
    return [];
  }
}

export class CreditAuditLabelLengthRule implements CreditAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditAuditCreatedAtRangeRule implements CreditAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditAudit): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditAuditRequiredCodeRule implements CreditAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditAuditRequiredReviewerRule implements CreditAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditAudit): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit audit. */
export class CreditAuditValidator {
  rules: CreditAuditRule[];

  constructor(rules: CreditAuditRule[]) {
    this.rules = rules;
  }

  validate(item: CreditAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditAudit[]): Map<string, string[]> {
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

export function defaultCreditAuditValidator(): CreditAuditValidator {
  return new CreditAuditValidator(
    [
      new CreditAuditAllowedReviewerRule(["default"]),
      new CreditAuditLabelLengthRule(255),
      new CreditAuditCreatedAtRangeRule(3600, 3600),
      new CreditAuditRequiredCodeRule("credit audit needs a value"),
      new CreditAuditRequiredReviewerRule("credit audit needs an entry"),
    ],
  );
}
