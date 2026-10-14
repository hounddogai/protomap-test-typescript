import * as text from "../../../../kit/text.js";
import { ReplyAudit } from "./reply-audit.js";

/** A rule a reply audit must pass. Check returns its problems, or none. */
export interface ReplyAuditRule {
  check(item: ReplyAudit): string[];
}

export class ReplyAuditAllowedTitleRule implements ReplyAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class ReplyAuditCodeLengthRule implements ReplyAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyAuditDiscountRangeRule implements ReplyAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyAudit): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyAuditContactEmailLengthRule implements ReplyAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAudit): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply audit. */
export class ReplyAuditValidator {
  rules: ReplyAuditRule[];

  constructor(rules: ReplyAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyAudit): string[] {
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

  requireValid(item: ReplyAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyAudit[]): Map<string, string[]> {
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

export function defaultReplyAuditValidator(): ReplyAuditValidator {
  return new ReplyAuditValidator(
    [
      new ReplyAuditAllowedTitleRule([]),
      new ReplyAuditCodeLengthRule(255),
      new ReplyAuditDiscountRangeRule(4, 1121.6),
      new ReplyAuditContactEmailLengthRule(86400),
    ],
  );
}
