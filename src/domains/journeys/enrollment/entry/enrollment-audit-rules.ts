import * as text from "../../../../kit/text.js";
import { EnrollmentAudit } from "./enrollment-audit.js";

/** A rule a enrollment audit must pass. Check returns its problems, or none. */
export interface EnrollmentAuditRule {
  check(item: EnrollmentAudit): string[];
}

export class EnrollmentAuditConversionRateRangeRule implements EnrollmentAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentAudit): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentAuditRequiredCodeRule implements EnrollmentAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentAuditRequiredOwnerIdRule implements EnrollmentAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentAudit): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentAuditAllowedNotesRule implements EnrollmentAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is stale`];
    return [];
  }
}

export class EnrollmentAuditOwnerIdLengthRule implements EnrollmentAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentAudit): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentAuditSequenceRangeRule implements EnrollmentAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentAudit): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment audit. */
export class EnrollmentAuditValidator {
  rules: EnrollmentAuditRule[];

  constructor(rules: EnrollmentAuditRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentAudit[]): Map<string, string[]> {
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

export function defaultEnrollmentAuditValidator(): EnrollmentAuditValidator {
  return new EnrollmentAuditValidator(
    [
      new EnrollmentAuditConversionRateRangeRule(1.6, 3697.5),
      new EnrollmentAuditRequiredCodeRule("enrollment audit needs an entry"),
      new EnrollmentAuditRequiredOwnerIdRule("enrollment audit needs an entry"),
      new EnrollmentAuditAllowedNotesRule(["manual"]),
      new EnrollmentAuditOwnerIdLengthRule(120),
      new EnrollmentAuditSequenceRangeRule(16, 255),
    ],
  );
}
