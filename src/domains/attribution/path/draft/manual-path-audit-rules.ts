import * as text from "../../../../kit/text.js";
import { ManualPathAudit } from "./manual-path-audit.js";

/** A rule a manual path audit must pass. Check returns its problems, or none. */
export interface ManualPathAuditRule {
  check(item: ManualPathAudit): string[];
}

export class ManualPathAuditApprovedGuardRule implements ManualPathAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualPathAudit): string[] {
    if (item.approved && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ManualPathAuditAllowedCodeRule implements ManualPathAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPathAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class ManualPathAuditFloorValueRangeRule implements ManualPathAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPathAudit): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPathAuditRequiredCodeRule implements ManualPathAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPathAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPathAuditCodeLengthRule implements ManualPathAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPathAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPathAuditRequiredLabelRule implements ManualPathAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPathAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual path audit. */
export class ManualPathAuditValidator {
  rules: ManualPathAuditRule[];

  constructor(rules: ManualPathAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPathAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPathAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPathAudit[]): Map<string, string[]> {
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

export function defaultManualPathAuditValidator(): ManualPathAuditValidator {
  return new ManualPathAuditValidator(
    [
      new ManualPathAuditApprovedGuardRule(255),
      new ManualPathAuditAllowedCodeRule(["manual"]),
      new ManualPathAuditFloorValueRangeRule(0.2, 306),
      new ManualPathAuditRequiredCodeRule("manual path audit needs an entry"),
      new ManualPathAuditCodeLengthRule(80),
      new ManualPathAuditRequiredLabelRule("manual path audit needs this field"),
    ],
  );
}
