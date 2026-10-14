import * as text from "../../../../kit/text.js";
import { PendingProofAudit } from "./pending-proof-audit.js";

/** A rule a pending proof audit must pass. Check returns its problems, or none. */
export interface PendingProofAuditRule {
  check(item: PendingProofAudit): string[];
}

export class PendingProofAuditApprovedGuardRule implements PendingProofAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingProofAudit): string[] {
    if (item.approved && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PendingProofAuditRequiredTimezoneRule implements PendingProofAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingProofAudit): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingProofAuditBidRangeRule implements PendingProofAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingProofAudit): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingProofAuditCodeLengthRule implements PendingProofAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingProofAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingProofAuditAllowedTitleRule implements PendingProofAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingProofAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

/** Runs every rule of a pending proof audit. */
export class PendingProofAuditValidator {
  rules: PendingProofAuditRule[];

  constructor(rules: PendingProofAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingProofAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingProofAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingProofAudit[]): Map<string, string[]> {
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

export function defaultPendingProofAuditValidator(): PendingProofAuditValidator {
  return new PendingProofAuditValidator(
    [
      new PendingProofAuditApprovedGuardRule(9.1),
      new PendingProofAuditRequiredTimezoneRule("pending proof audit needs a value"),
      new PendingProofAuditBidRangeRule(8.1, 555.4),
      new PendingProofAuditCodeLengthRule(16),
      new PendingProofAuditAllowedTitleRule([]),
    ],
  );
}
