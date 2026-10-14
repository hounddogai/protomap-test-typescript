import { PendingTierAudit } from "./pending-tier-audit.js";

/** A rule a pending tier audit must pass. Check returns its problems, or none. */
export interface PendingTierAuditRule {
  check(item: PendingTierAudit): string[];
}

export class PendingTierAuditRequiredTitleRule implements PendingTierAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingTierAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingTierAuditQuantityRangeRule implements PendingTierAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingTierAudit): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingTierAuditRequiredNotesRule implements PendingTierAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingTierAudit): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PendingTierAuditCodePrefixRule implements PendingTierAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingTierAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingTierAuditRequiredCodeRule implements PendingTierAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingTierAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending tier audit. */
export class PendingTierAuditValidator {
  rules: PendingTierAuditRule[];

  constructor(rules: PendingTierAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingTierAudit): string[] {
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

  requireValid(item: PendingTierAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingTierAudit[]): Map<string, string[]> {
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

export function defaultPendingTierAuditValidator(): PendingTierAuditValidator {
  return new PendingTierAuditValidator(
    [
      new PendingTierAuditRequiredTitleRule("pending tier audit needs an entry"),
      new PendingTierAuditQuantityRangeRule(255, 1000),
      new PendingTierAuditRequiredNotesRule("pending tier audit needs this field"),
      new PendingTierAuditCodePrefixRule("ACM"),
      new PendingTierAuditRequiredCodeRule("pending tier audit needs an entry"),
    ],
  );
}
