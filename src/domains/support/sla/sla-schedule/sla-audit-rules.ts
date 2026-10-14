import * as text from "../../../../kit/text.js";
import { SlaAudit } from "./sla-audit.js";

/** A rule a sla audit must pass. Check returns its problems, or none. */
export interface SlaAuditRule {
  check(item: SlaAudit): string[];
}

export class SlaAuditRequiredCodeRule implements SlaAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaAuditChannelLengthRule implements SlaAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaAuditPhoneLengthRule implements SlaAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAudit): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaAuditAllowedChannelRule implements SlaAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is unknown`];
    return [];
  }
}

export class SlaAuditActiveGuardRule implements SlaAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SlaAudit): string[] {
    if (item.active && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class SlaAuditTitleLengthRule implements SlaAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla audit. */
export class SlaAuditValidator {
  rules: SlaAuditRule[];

  constructor(rules: SlaAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SlaAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaAudit[]): Map<string, string[]> {
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

export function defaultSlaAuditValidator(): SlaAuditValidator {
  return new SlaAuditValidator(
    [
      new SlaAuditRequiredCodeRule("sla audit needs a value"),
      new SlaAuditChannelLengthRule(16),
      new SlaAuditPhoneLengthRule(86400),
      new SlaAuditAllowedChannelRule([]),
      new SlaAuditActiveGuardRule(120),
      new SlaAuditTitleLengthRule(86400),
    ],
  );
}
