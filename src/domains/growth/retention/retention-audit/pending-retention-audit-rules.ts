import * as text from "../../../../kit/text.js";
import { PendingRetentionAudit } from "./pending-retention-audit.js";

/** A rule a pending retention audit must pass. Check returns its problems, or none. */
export interface PendingRetentionAuditRule {
  check(item: PendingRetentionAudit): string[];
}

export class PendingRetentionAuditCodePrefixRule implements PendingRetentionAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingRetentionAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingRetentionAuditAllowedTitleRule implements PendingRetentionAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingRetentionAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class PendingRetentionAuditCodeLengthRule implements PendingRetentionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRetentionAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRetentionAuditRequiredReviewerRule implements PendingRetentionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRetentionAudit): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRetentionAuditBudgetRangeRule implements PendingRetentionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRetentionAudit): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pending retention audit. */
export class PendingRetentionAuditValidator {
  rules: PendingRetentionAuditRule[];

  constructor(rules: PendingRetentionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRetentionAudit): string[] {
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

  requireValid(item: PendingRetentionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRetentionAudit[]): Map<string, string[]> {
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

export function defaultPendingRetentionAuditValidator(): PendingRetentionAuditValidator {
  return new PendingRetentionAuditValidator(
    [
      new PendingRetentionAuditCodePrefixRule("ACM"),
      new PendingRetentionAuditAllowedTitleRule(["pending", "manual"]),
      new PendingRetentionAuditCodeLengthRule(64),
      new PendingRetentionAuditRequiredReviewerRule("pending retention audit needs a value"),
      new PendingRetentionAuditBudgetRangeRule(2.6, 2233.4),
    ],
  );
}
