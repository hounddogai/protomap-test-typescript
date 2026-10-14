import * as text from "../../../../kit/text.js";
import { PendingReplyAudit } from "./pending-reply-audit.js";

/** A rule a pending reply audit must pass. Check returns its problems, or none. */
export interface PendingReplyAuditRule {
  check(item: PendingReplyAudit): string[];
}

export class PendingReplyAuditRequiredNameRule implements PendingReplyAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReplyAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReplyAuditNameLengthRule implements PendingReplyAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingReplyAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingReplyAuditAllowedCodeRule implements PendingReplyAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingReplyAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class PendingReplyAuditSourceLengthRule implements PendingReplyAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingReplyAudit): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending reply audit. */
export class PendingReplyAuditValidator {
  rules: PendingReplyAuditRule[];

  constructor(rules: PendingReplyAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingReplyAudit): string[] {
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

  requireValid(item: PendingReplyAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingReplyAudit[]): Map<string, string[]> {
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

export function defaultPendingReplyAuditValidator(): PendingReplyAuditValidator {
  return new PendingReplyAuditValidator(
    [
      new PendingReplyAuditRequiredNameRule("pending reply audit needs a value"),
      new PendingReplyAuditNameLengthRule(16),
      new PendingReplyAuditAllowedCodeRule([]),
      new PendingReplyAuditSourceLengthRule(80),
    ],
  );
}
