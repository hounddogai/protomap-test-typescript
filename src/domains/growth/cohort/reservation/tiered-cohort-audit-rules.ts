import { TieredCohortAudit } from "./tiered-cohort-audit.js";

/** A rule a tiered cohort audit must pass. Check returns its problems, or none. */
export interface TieredCohortAuditRule {
  check(item: TieredCohortAudit): string[];
}

export class TieredCohortAuditRequiredTimezoneRule implements TieredCohortAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCohortAudit): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCohortAuditActiveGuardRule implements TieredCohortAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredCohortAudit): string[] {
    if (item.active && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class TieredCohortAuditLabelLengthRule implements TieredCohortAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCohortAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCohortAuditJourneyIdLengthRule implements TieredCohortAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCohortAudit): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCohortAuditCodePrefixRule implements TieredCohortAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredCohortAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered cohort audit. */
export class TieredCohortAuditValidator {
  rules: TieredCohortAuditRule[];

  constructor(rules: TieredCohortAuditRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCohortAudit): string[] {
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

  requireValid(item: TieredCohortAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCohortAudit[]): Map<string, string[]> {
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

export function defaultTieredCohortAuditValidator(): TieredCohortAuditValidator {
  return new TieredCohortAuditValidator(
    [
      new TieredCohortAuditRequiredTimezoneRule("tiered cohort audit needs this field"),
      new TieredCohortAuditActiveGuardRule(86400),
      new TieredCohortAuditLabelLengthRule(80),
      new TieredCohortAuditJourneyIdLengthRule(16),
      new TieredCohortAuditCodePrefixRule("X"),
    ],
  );
}
