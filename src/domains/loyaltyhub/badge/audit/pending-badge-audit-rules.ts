import { PendingBadgeAudit } from "./pending-badge-audit.js";

/** A rule a pending badge audit must pass. Check returns its problems, or none. */
export interface PendingBadgeAuditRule {
  check(item: PendingBadgeAudit): string[];
}

export class PendingBadgeAuditTitleLengthRule implements PendingBadgeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBadgeAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBadgeAuditRequiredCodeRule implements PendingBadgeAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBadgeAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBadgeAuditCreatedAtRangeRule implements PendingBadgeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBadgeAudit): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBadgeAuditCodePrefixRule implements PendingBadgeAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingBadgeAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending badge audit. */
export class PendingBadgeAuditValidator {
  rules: PendingBadgeAuditRule[];

  constructor(rules: PendingBadgeAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBadgeAudit): string[] {
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

  requireValid(item: PendingBadgeAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBadgeAudit[]): Map<string, string[]> {
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

export function defaultPendingBadgeAuditValidator(): PendingBadgeAuditValidator {
  return new PendingBadgeAuditValidator(
    [
      new PendingBadgeAuditTitleLengthRule(120),
      new PendingBadgeAuditRequiredCodeRule("pending badge audit needs an entry"),
      new PendingBadgeAuditCreatedAtRangeRule(64, 3600),
      new PendingBadgeAuditCodePrefixRule("ACM"),
    ],
  );
}
