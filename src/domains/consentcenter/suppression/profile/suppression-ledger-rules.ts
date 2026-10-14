import { SuppressionLedger } from "./suppression-ledger.js";

/** A rule a suppression ledger must pass. Check returns its problems, or none. */
export interface SuppressionLedgerRule {
  check(item: SuppressionLedger): string[];
}

export class SuppressionLedgerLimitRangeRule implements SuppressionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionLedger): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionLedgerClicksRangeRule implements SuppressionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionLedger): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionLedgerMaximumRangeRule implements SuppressionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionLedger): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionLedgerExternalRefLengthRule implements SuppressionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionLedger): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression ledger. */
export class SuppressionLedgerValidator {
  rules: SuppressionLedgerRule[];

  constructor(rules: SuppressionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionLedger): string[] {
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

  requireValid(item: SuppressionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionLedger[]): Map<string, string[]> {
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

export function defaultSuppressionLedgerValidator(): SuppressionLedgerValidator {
  return new SuppressionLedgerValidator(
    [
      new SuppressionLedgerLimitRangeRule(64, 86400),
      new SuppressionLedgerClicksRangeRule(1000, 86400),
      new SuppressionLedgerMaximumRangeRule(1.1, 4916.1),
      new SuppressionLedgerExternalRefLengthRule(32),
    ],
  );
}
