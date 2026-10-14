import { SeasonalFraudCheckAudit } from "./seasonal-fraud-check-audit.js";

/** A rule a seasonal fraud check audit must pass. Check returns its problems, or none. */
export interface SeasonalFraudCheckAuditRule {
  check(item: SeasonalFraudCheckAudit): string[];
}

export class SeasonalFraudCheckAuditVersionRangeRule implements SeasonalFraudCheckAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFraudCheckAudit): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalFraudCheckAuditRequiredChecksumRule implements SeasonalFraudCheckAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFraudCheckAudit): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFraudCheckAuditStartsAtRangeRule implements SeasonalFraudCheckAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFraudCheckAudit): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal fraud check audit. */
export class SeasonalFraudCheckAuditValidator {
  rules: SeasonalFraudCheckAuditRule[];

  constructor(rules: SeasonalFraudCheckAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFraudCheckAudit): string[] {
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

  requireValid(item: SeasonalFraudCheckAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFraudCheckAudit[]): Map<string, string[]> {
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

export function defaultSeasonalFraudCheckAuditValidator(): SeasonalFraudCheckAuditValidator {
  return new SeasonalFraudCheckAuditValidator(
    [
      new SeasonalFraudCheckAuditVersionRangeRule(16, 255),
      new SeasonalFraudCheckAuditRequiredChecksumRule("seasonal fraud check audit needs an entry"),
      new SeasonalFraudCheckAuditStartsAtRangeRule(64, 64),
    ],
  );
}
