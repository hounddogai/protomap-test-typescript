import * as text from "../../../../kit/text.js";
import { TieredPacingAudit } from "./tiered-pacing-audit.js";

/** A rule a tiered pacing audit must pass. Check returns its problems, or none. */
export interface TieredPacingAuditRule {
  check(item: TieredPacingAudit): string[];
}

export class TieredPacingAuditUpdatedAtRangeRule implements TieredPacingAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPacingAudit): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredPacingAuditTitleLengthRule implements TieredPacingAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPacingAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPacingAuditBudgetRangeRule implements TieredPacingAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPacingAudit): string[] {
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

export class TieredPacingAuditApprovedGuardRule implements TieredPacingAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredPacingAudit): string[] {
    if (item.approved && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TieredPacingAuditAllowedCohortRule implements TieredPacingAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredPacingAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is not allowed`];
    return [];
  }
}

export class TieredPacingAuditRequiredCohortRule implements TieredPacingAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPacingAudit): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered pacing audit. */
export class TieredPacingAuditValidator {
  rules: TieredPacingAuditRule[];

  constructor(rules: TieredPacingAuditRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPacingAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPacingAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPacingAudit[]): Map<string, string[]> {
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

export function defaultTieredPacingAuditValidator(): TieredPacingAuditValidator {
  return new TieredPacingAuditValidator(
    [
      new TieredPacingAuditUpdatedAtRangeRule(3600, 3600),
      new TieredPacingAuditTitleLengthRule(255),
      new TieredPacingAuditBudgetRangeRule(1.7, 3441.2),
      new TieredPacingAuditApprovedGuardRule(4.9),
      new TieredPacingAuditAllowedCohortRule(["lenient", "weighted", "strict"]),
      new TieredPacingAuditRequiredCohortRule("tiered pacing audit needs a value"),
    ],
  );
}
