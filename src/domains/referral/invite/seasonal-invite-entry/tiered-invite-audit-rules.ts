import { TieredInviteAudit } from "./tiered-invite-audit.js";

/** A rule a tiered invite audit must pass. Check returns its problems, or none. */
export interface TieredInviteAuditRule {
  check(item: TieredInviteAudit): string[];
}

export class TieredInviteAuditPriorityRangeRule implements TieredInviteAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredInviteAudit): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredInviteAuditUpdatedAtRangeRule implements TieredInviteAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredInviteAudit): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredInviteAuditSendAtRangeRule implements TieredInviteAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredInviteAudit): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredInviteAuditRequiredCodeRule implements TieredInviteAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredInviteAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered invite audit. */
export class TieredInviteAuditValidator {
  rules: TieredInviteAuditRule[];

  constructor(rules: TieredInviteAuditRule[]) {
    this.rules = rules;
  }

  validate(item: TieredInviteAudit): string[] {
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

  requireValid(item: TieredInviteAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredInviteAudit[]): Map<string, string[]> {
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

export function defaultTieredInviteAuditValidator(): TieredInviteAuditValidator {
  return new TieredInviteAuditValidator(
    [
      new TieredInviteAuditPriorityRangeRule(16, 120),
      new TieredInviteAuditUpdatedAtRangeRule(80, 255),
      new TieredInviteAuditSendAtRangeRule(255, 3600),
      new TieredInviteAuditRequiredCodeRule("tiered invite audit needs this field"),
    ],
  );
}
