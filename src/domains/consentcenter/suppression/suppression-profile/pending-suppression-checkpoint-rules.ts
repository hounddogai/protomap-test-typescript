import { PendingSuppressionCheckpoint } from "./pending-suppression-checkpoint.js";

/** A rule a pending suppression checkpoint must pass. Check returns its problems, or none. */
export interface PendingSuppressionCheckpointRule {
  check(item: PendingSuppressionCheckpoint): string[];
}

export class PendingSuppressionCheckpointDiscountRangeRule implements PendingSuppressionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSuppressionCheckpoint): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSuppressionCheckpointConversionRateRangeRule implements PendingSuppressionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSuppressionCheckpoint): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSuppressionCheckpointAmountRangeRule implements PendingSuppressionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSuppressionCheckpoint): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending suppression checkpoint. */
export class PendingSuppressionCheckpointValidator {
  rules: PendingSuppressionCheckpointRule[];

  constructor(rules: PendingSuppressionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSuppressionCheckpoint): string[] {
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

  requireValid(item: PendingSuppressionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSuppressionCheckpoint[]): Map<string, string[]> {
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

export function defaultPendingSuppressionCheckpointValidator(): PendingSuppressionCheckpointValidator {
  return new PendingSuppressionCheckpointValidator(
    [
      new PendingSuppressionCheckpointDiscountRangeRule(4.3, 2203.3),
      new PendingSuppressionCheckpointConversionRateRangeRule(1.3, 451.6),
      new PendingSuppressionCheckpointAmountRangeRule(5.7, 3571.2),
    ],
  );
}
