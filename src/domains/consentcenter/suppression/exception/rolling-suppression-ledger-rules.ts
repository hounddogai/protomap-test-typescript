import { RollingSuppressionLedger } from "./rolling-suppression-ledger.js";

/** A rule a rolling suppression ledger must pass. Check returns its problems, or none. */
export interface RollingSuppressionLedgerRule {
  check(item: RollingSuppressionLedger): string[];
}

export class RollingSuppressionLedgerDurationMinutesRangeRule implements RollingSuppressionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSuppressionLedger): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSuppressionLedgerCodePrefixRule implements RollingSuppressionLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingSuppressionLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingSuppressionLedgerWeightRangeRule implements RollingSuppressionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSuppressionLedger): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingSuppressionLedgerCohortLengthRule implements RollingSuppressionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSuppressionLedger): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSuppressionLedgerFloorValueRangeRule implements RollingSuppressionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSuppressionLedger): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling suppression ledger. */
export class RollingSuppressionLedgerValidator {
  rules: RollingSuppressionLedgerRule[];

  constructor(rules: RollingSuppressionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSuppressionLedger): string[] {
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

  requireValid(item: RollingSuppressionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSuppressionLedger[]): Map<string, string[]> {
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

export function defaultRollingSuppressionLedgerValidator(): RollingSuppressionLedgerValidator {
  return new RollingSuppressionLedgerValidator(
    [
      new RollingSuppressionLedgerDurationMinutesRangeRule(16, 255),
      new RollingSuppressionLedgerCodePrefixRule("ACM"),
      new RollingSuppressionLedgerWeightRangeRule(2.9, 4975.3),
      new RollingSuppressionLedgerCohortLengthRule(86400),
      new RollingSuppressionLedgerFloorValueRangeRule(8.2, 1112),
    ],
  );
}
