import * as text from "../../../../kit/text.js";
import { ApprovalAudit } from "./approval-audit.js";

/** A rule a approval audit must pass. Check returns its problems, or none. */
export interface ApprovalAuditRule {
  check(item: ApprovalAudit): string[];
}

export class ApprovalAuditCapacityRangeRule implements ApprovalAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalAudit): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalAuditRequiredChecksumRule implements ApprovalAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalAudit): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalAuditRequiredOwnerIdRule implements ApprovalAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalAudit): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalAuditRetriesRangeRule implements ApprovalAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalAudit): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalAuditAllowedChecksumRule implements ApprovalAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is duplicated`];
    return [];
  }
}

export class ApprovalAuditChecksumLengthRule implements ApprovalAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAudit): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval audit. */
export class ApprovalAuditValidator {
  rules: ApprovalAuditRule[];

  constructor(rules: ApprovalAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalAudit): string[] {
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

  requireValid(item: ApprovalAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalAudit[]): Map<string, string[]> {
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

export function defaultApprovalAuditValidator(): ApprovalAuditValidator {
  return new ApprovalAuditValidator(
    [
      new ApprovalAuditCapacityRangeRule(255, 3600),
      new ApprovalAuditRequiredChecksumRule("approval audit needs a value"),
      new ApprovalAuditRequiredOwnerIdRule("approval audit needs a value"),
      new ApprovalAuditRetriesRangeRule(32, 120),
      new ApprovalAuditAllowedChecksumRule(["capped"]),
      new ApprovalAuditChecksumLengthRule(64),
    ],
  );
}
