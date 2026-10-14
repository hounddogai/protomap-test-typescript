import { TieredFraudCheckSnapshot } from "./tiered-fraud-check-snapshot.js";

/** A rule a tiered fraud check snapshot must pass. Check returns its problems, or none. */
export interface TieredFraudCheckSnapshotRule {
  check(item: TieredFraudCheckSnapshot): string[];
}

export class TieredFraudCheckSnapshotRevisionRangeRule implements TieredFraudCheckSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFraudCheckSnapshot): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredFraudCheckSnapshotCodePrefixRule implements TieredFraudCheckSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredFraudCheckSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredFraudCheckSnapshotLabelLengthRule implements TieredFraudCheckSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFraudCheckSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFraudCheckSnapshotRequiredLabelRule implements TieredFraudCheckSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFraudCheckSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFraudCheckSnapshotRequiredCodeRule implements TieredFraudCheckSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFraudCheckSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFraudCheckSnapshotFrequencyCapRangeRule implements TieredFraudCheckSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFraudCheckSnapshot): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered fraud check snapshot. */
export class TieredFraudCheckSnapshotValidator {
  rules: TieredFraudCheckSnapshotRule[];

  constructor(rules: TieredFraudCheckSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFraudCheckSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredFraudCheckSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFraudCheckSnapshot[]): Map<string, string[]> {
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

export function defaultTieredFraudCheckSnapshotValidator(): TieredFraudCheckSnapshotValidator {
  return new TieredFraudCheckSnapshotValidator(
    [
      new TieredFraudCheckSnapshotRevisionRangeRule(16, 255),
      new TieredFraudCheckSnapshotCodePrefixRule("OPS"),
      new TieredFraudCheckSnapshotLabelLengthRule(32),
      new TieredFraudCheckSnapshotRequiredLabelRule("tiered fraud check snapshot needs a value"),
      new TieredFraudCheckSnapshotRequiredCodeRule("tiered fraud check snapshot needs this field"),
      new TieredFraudCheckSnapshotFrequencyCapRangeRule(64, 255),
    ],
  );
}
