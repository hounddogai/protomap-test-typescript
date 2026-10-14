import * as text from "../../../../kit/text.js";
import { LegacyTicketViewAudit } from "./legacy-ticket-view-audit.js";

/** A rule a legacy ticket view audit must pass. Check returns its problems, or none. */
export interface LegacyTicketViewAuditRule {
  check(item: LegacyTicketViewAudit): string[];
}

export class LegacyTicketViewAuditRequiredSegmentRule implements LegacyTicketViewAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyTicketViewAudit): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyTicketViewAuditAllowedContactEmailRule implements LegacyTicketViewAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyTicketViewAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is not allowed`];
    return [];
  }
}

export class LegacyTicketViewAuditLabelLengthRule implements LegacyTicketViewAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTicketViewAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyTicketViewAuditUpdatedAtRangeRule implements LegacyTicketViewAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTicketViewAudit): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyTicketViewAuditBudgetRangeRule implements LegacyTicketViewAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTicketViewAudit): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyTicketViewAuditContactEmailLengthRule implements LegacyTicketViewAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTicketViewAudit): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy ticket view audit. */
export class LegacyTicketViewAuditValidator {
  rules: LegacyTicketViewAuditRule[];

  constructor(rules: LegacyTicketViewAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTicketViewAudit): string[] {
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

  requireValid(item: LegacyTicketViewAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTicketViewAudit[]): Map<string, string[]> {
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

export function defaultLegacyTicketViewAuditValidator(): LegacyTicketViewAuditValidator {
  return new LegacyTicketViewAuditValidator(
    [
      new LegacyTicketViewAuditRequiredSegmentRule("legacy ticket view audit needs an entry"),
      new LegacyTicketViewAuditAllowedContactEmailRule(["lenient", "lenient", "regional"]),
      new LegacyTicketViewAuditLabelLengthRule(64),
      new LegacyTicketViewAuditUpdatedAtRangeRule(255, 3600),
      new LegacyTicketViewAuditBudgetRangeRule(8, 3370.2),
      new LegacyTicketViewAuditContactEmailLengthRule(120),
    ],
  );
}
