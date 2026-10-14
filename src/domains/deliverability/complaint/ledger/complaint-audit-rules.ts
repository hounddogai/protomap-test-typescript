import * as text from "../../../../kit/text.js";
import { ComplaintAudit } from "./complaint-audit.js";

/** A rule a complaint audit must pass. Check returns its problems, or none. */
export interface ComplaintAuditRule {
  check(item: ComplaintAudit): string[];
}

export class ComplaintAuditAllowedNotesRule implements ComplaintAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ComplaintAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is not allowed`];
    return [];
  }
}

export class ComplaintAuditCodeLengthRule implements ComplaintAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintAuditRequiredCodeRule implements ComplaintAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint audit. */
export class ComplaintAuditValidator {
  rules: ComplaintAuditRule[];

  constructor(rules: ComplaintAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintAudit): string[] {
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

  requireValid(item: ComplaintAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintAudit[]): Map<string, string[]> {
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

export function defaultComplaintAuditValidator(): ComplaintAuditValidator {
  return new ComplaintAuditValidator(
    [
      new ComplaintAuditAllowedNotesRule(["adaptive"]),
      new ComplaintAuditCodeLengthRule(120),
      new ComplaintAuditRequiredCodeRule("complaint audit needs this field"),
    ],
  );
}
