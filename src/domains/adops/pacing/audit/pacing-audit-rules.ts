import * as text from "../../../../kit/text.js";
import { PacingAudit } from "./pacing-audit.js";

/** A rule a pacing audit must pass. Check returns its problems, or none. */
export interface PacingAuditRule {
  check(item: PacingAudit): string[];
}

export class PacingAuditRequiredCodeRule implements PacingAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingAuditAllowedContactEmailRule implements PacingAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is inconsistent`];
    return [];
  }
}

export class PacingAuditLimitRangeRule implements PacingAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingAudit): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingAuditRequiredOwnerIdRule implements PacingAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingAudit): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PacingAuditAmountRangeRule implements PacingAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingAudit): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingAuditTitleLengthRule implements PacingAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing audit. */
export class PacingAuditValidator {
  rules: PacingAuditRule[];

  constructor(rules: PacingAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PacingAudit): string[] {
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

  requireValid(item: PacingAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingAudit[]): Map<string, string[]> {
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

export function defaultPacingAuditValidator(): PacingAuditValidator {
  return new PacingAuditValidator(
    [
      new PacingAuditRequiredCodeRule("pacing audit needs this field"),
      new PacingAuditAllowedContactEmailRule(["pending", "capped", "rolling"]),
      new PacingAuditLimitRangeRule(16, 80),
      new PacingAuditRequiredOwnerIdRule("pacing audit needs a value"),
      new PacingAuditAmountRangeRule(9.8, 483.9),
      new PacingAuditTitleLengthRule(120),
    ],
  );
}
