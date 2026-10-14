import * as text from "../../../../kit/text.js";
import { InviteAudit } from "./invite-audit.js";

/** A rule a invite audit must pass. Check returns its problems, or none. */
export interface InviteAuditRule {
  check(item: InviteAudit): string[];
}

export class InviteAuditGraceDaysRangeRule implements InviteAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteAudit): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteAuditFloorValueRangeRule implements InviteAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteAudit): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteAuditAllowedLabelRule implements InviteAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

/** Runs every rule of a invite audit. */
export class InviteAuditValidator {
  rules: InviteAuditRule[];

  constructor(rules: InviteAuditRule[]) {
    this.rules = rules;
  }

  validate(item: InviteAudit): string[] {
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

  requireValid(item: InviteAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteAudit[]): Map<string, string[]> {
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

export function defaultInviteAuditValidator(): InviteAuditValidator {
  return new InviteAuditValidator(
    [
      new InviteAuditGraceDaysRangeRule(64, 3600),
      new InviteAuditFloorValueRangeRule(8.4, 3683.4),
      new InviteAuditAllowedLabelRule(["tiered", "batched", "manual"]),
    ],
  );
}
