import { SeasonalModelAudit } from "./seasonal-model-audit.js";

/** A rule a seasonal model audit must pass. Check returns its problems, or none. */
export interface SeasonalModelAuditRule {
  check(item: SeasonalModelAudit): string[];
}

export class SeasonalModelAuditBudgetRangeRule implements SeasonalModelAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalModelAudit): string[] {
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

export class SeasonalModelAuditApprovedGuardRule implements SeasonalModelAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalModelAudit): string[] {
    if (item.approved && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class SeasonalModelAuditLabelLengthRule implements SeasonalModelAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalModelAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal model audit. */
export class SeasonalModelAuditValidator {
  rules: SeasonalModelAuditRule[];

  constructor(rules: SeasonalModelAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalModelAudit): string[] {
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

  requireValid(item: SeasonalModelAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalModelAudit[]): Map<string, string[]> {
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

export function defaultSeasonalModelAuditValidator(): SeasonalModelAuditValidator {
  return new SeasonalModelAuditValidator(
    [
      new SeasonalModelAuditBudgetRangeRule(4.7, 3517.6),
      new SeasonalModelAuditApprovedGuardRule(7.6),
      new SeasonalModelAuditLabelLengthRule(80),
    ],
  );
}
