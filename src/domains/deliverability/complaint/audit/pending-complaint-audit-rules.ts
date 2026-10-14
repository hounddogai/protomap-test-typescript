import { PendingComplaintAudit } from "./pending-complaint-audit.js";

/** A rule a pending complaint audit must pass. Check returns its problems, or none. */
export interface PendingComplaintAuditRule {
  check(item: PendingComplaintAudit): string[];
}

export class PendingComplaintAuditCodePrefixRule implements PendingComplaintAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingComplaintAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingComplaintAuditLabelLengthRule implements PendingComplaintAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingComplaintAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingComplaintAuditRequiredCodeRule implements PendingComplaintAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingComplaintAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingComplaintAuditBatchSizeRangeRule implements PendingComplaintAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingComplaintAudit): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pending complaint audit. */
export class PendingComplaintAuditValidator {
  rules: PendingComplaintAuditRule[];

  constructor(rules: PendingComplaintAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingComplaintAudit): string[] {
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

  requireValid(item: PendingComplaintAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingComplaintAudit[]): Map<string, string[]> {
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

export function defaultPendingComplaintAuditValidator(): PendingComplaintAuditValidator {
  return new PendingComplaintAuditValidator(
    [
      new PendingComplaintAuditCodePrefixRule("REF"),
      new PendingComplaintAuditLabelLengthRule(16),
      new PendingComplaintAuditRequiredCodeRule("pending complaint audit needs a value"),
      new PendingComplaintAuditBatchSizeRangeRule(16, 255),
    ],
  );
}
