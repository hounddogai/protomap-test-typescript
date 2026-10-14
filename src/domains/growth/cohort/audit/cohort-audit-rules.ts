import * as text from "../../../../kit/text.js";
import { CohortAudit } from "./cohort-audit.js";

/** A rule a cohort audit must pass. Check returns its problems, or none. */
export interface CohortAuditRule {
  check(item: CohortAudit): string[];
}

export class CohortAuditRateRangeRule implements CohortAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortAudit): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortAuditCeilingRangeRule implements CohortAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortAudit): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortAuditActiveGuardRule implements CohortAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CohortAudit): string[] {
    if (item.active && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while active`];
    return [];
  }
}

export class CohortAuditAllowedLabelRule implements CohortAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

/** Runs every rule of a cohort audit. */
export class CohortAuditValidator {
  rules: CohortAuditRule[];

  constructor(rules: CohortAuditRule[]) {
    this.rules = rules;
  }

  validate(item: CohortAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortAudit[]): Map<string, string[]> {
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

export function defaultCohortAuditValidator(): CohortAuditValidator {
  return new CohortAuditValidator(
    [
      new CohortAuditRateRangeRule(1.1, 4325.5),
      new CohortAuditCeilingRangeRule(8.3, 2176.6),
      new CohortAuditActiveGuardRule(0.1),
      new CohortAuditAllowedLabelRule(["fallback", "weighted"]),
    ],
  );
}
