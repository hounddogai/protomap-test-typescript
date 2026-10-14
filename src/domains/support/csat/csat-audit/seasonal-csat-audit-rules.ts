import { SeasonalCsatAudit } from "./seasonal-csat-audit.js";

/** A rule a seasonal csat audit must pass. Check returns its problems, or none. */
export interface SeasonalCsatAuditRule {
  check(item: SeasonalCsatAudit): string[];
}

export class SeasonalCsatAuditNameLengthRule implements SeasonalCsatAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCsatAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalCsatAuditDiscountRangeRule implements SeasonalCsatAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCsatAudit): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalCsatAuditLabelLengthRule implements SeasonalCsatAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCsatAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal csat audit. */
export class SeasonalCsatAuditValidator {
  rules: SeasonalCsatAuditRule[];

  constructor(rules: SeasonalCsatAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCsatAudit): string[] {
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

  requireValid(item: SeasonalCsatAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCsatAudit[]): Map<string, string[]> {
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

export function defaultSeasonalCsatAuditValidator(): SeasonalCsatAuditValidator {
  return new SeasonalCsatAuditValidator(
    [
      new SeasonalCsatAuditNameLengthRule(1000),
      new SeasonalCsatAuditDiscountRangeRule(0.5, 1909.4),
      new SeasonalCsatAuditLabelLengthRule(16),
    ],
  );
}
