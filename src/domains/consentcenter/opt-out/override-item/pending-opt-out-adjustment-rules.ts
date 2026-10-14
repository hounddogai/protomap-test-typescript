import { PendingOptOutAdjustment } from "./pending-opt-out-adjustment.js";

/** A rule a pending opt out adjustment must pass. Check returns its problems, or none. */
export interface PendingOptOutAdjustmentRule {
  check(item: PendingOptOutAdjustment): string[];
}

export class PendingOptOutAdjustmentThresholdRangeRule implements PendingOptOutAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingOptOutAdjustment): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingOptOutAdjustmentEndsAtRangeRule implements PendingOptOutAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingOptOutAdjustment): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingOptOutAdjustmentSummaryLengthRule implements PendingOptOutAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingOptOutAdjustment): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingOptOutAdjustmentSendAtRangeRule implements PendingOptOutAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingOptOutAdjustment): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingOptOutAdjustmentConversionRateRangeRule implements PendingOptOutAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingOptOutAdjustment): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending opt out adjustment. */
export class PendingOptOutAdjustmentValidator {
  rules: PendingOptOutAdjustmentRule[];

  constructor(rules: PendingOptOutAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingOptOutAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingOptOutAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingOptOutAdjustment[]): Map<string, string[]> {
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

export function defaultPendingOptOutAdjustmentValidator(): PendingOptOutAdjustmentValidator {
  return new PendingOptOutAdjustmentValidator(
    [
      new PendingOptOutAdjustmentThresholdRangeRule(1.7, 4465.1),
      new PendingOptOutAdjustmentEndsAtRangeRule(1000, 86400),
      new PendingOptOutAdjustmentSummaryLengthRule(80),
      new PendingOptOutAdjustmentSendAtRangeRule(120, 255),
      new PendingOptOutAdjustmentConversionRateRangeRule(4, 2374.1),
    ],
  );
}
