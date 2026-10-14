import { CappedSlaAudit } from "./capped-sla-audit.js";

/** A rule a capped sla audit must pass. Check returns its problems, or none. */
export interface CappedSlaAuditRule {
  check(item: CappedSlaAudit): string[];
}

export class CappedSlaAuditRequiredSummaryRule implements CappedSlaAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSlaAudit): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSlaAuditSummaryLengthRule implements CappedSlaAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSlaAudit): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSlaAuditCodeLengthRule implements CappedSlaAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSlaAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSlaAuditRequiredContactEmailRule implements CappedSlaAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSlaAudit): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped sla audit. */
export class CappedSlaAuditValidator {
  rules: CappedSlaAuditRule[];

  constructor(rules: CappedSlaAuditRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSlaAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedSlaAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSlaAudit[]): Map<string, string[]> {
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

export function defaultCappedSlaAuditValidator(): CappedSlaAuditValidator {
  return new CappedSlaAuditValidator(
    [
      new CappedSlaAuditRequiredSummaryRule("capped sla audit needs this field"),
      new CappedSlaAuditSummaryLengthRule(32),
      new CappedSlaAuditCodeLengthRule(32),
      new CappedSlaAuditRequiredContactEmailRule("capped sla audit needs a value"),
    ],
  );
}
