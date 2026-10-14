import { FraudCheckSnapshot } from "./fraud-check-snapshot.js";

/** A rule a fraud check snapshot must pass. Check returns its problems, or none. */
export interface FraudCheckSnapshotRule {
  check(item: FraudCheckSnapshot): string[];
}

export class FraudCheckSnapshotTitleLengthRule implements FraudCheckSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckSnapshotDiscountRangeRule implements FraudCheckSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckSnapshot): string[] {
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

export class FraudCheckSnapshotRequiredTitleRule implements FraudCheckSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckSnapshotDurationMinutesRangeRule implements FraudCheckSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckSnapshot): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckSnapshotActiveGuardRule implements FraudCheckSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FraudCheckSnapshot): string[] {
    if (item.active && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while active`];
    return [];
  }
}

export class FraudCheckSnapshotJourneyIdLengthRule implements FraudCheckSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckSnapshot): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check snapshot. */
export class FraudCheckSnapshotValidator {
  rules: FraudCheckSnapshotRule[];

  constructor(rules: FraudCheckSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckSnapshot[]): Map<string, string[]> {
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

export function defaultFraudCheckSnapshotValidator(): FraudCheckSnapshotValidator {
  return new FraudCheckSnapshotValidator(
    [
      new FraudCheckSnapshotTitleLengthRule(86400),
      new FraudCheckSnapshotDiscountRangeRule(7.2, 3967.3),
      new FraudCheckSnapshotRequiredTitleRule("fraud check snapshot needs this field"),
      new FraudCheckSnapshotDurationMinutesRangeRule(120, 86400),
      new FraudCheckSnapshotActiveGuardRule(255),
      new FraudCheckSnapshotJourneyIdLengthRule(32),
    ],
  );
}
