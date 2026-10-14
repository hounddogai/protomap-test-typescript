import { WeightedLevelSnapshot } from "./weighted-level-snapshot.js";

/** A rule a weighted level snapshot must pass. Check returns its problems, or none. */
export interface WeightedLevelSnapshotRule {
  check(item: WeightedLevelSnapshot): string[];
}

export class WeightedLevelSnapshotAudienceIdLengthRule implements WeightedLevelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedLevelSnapshot): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedLevelSnapshotCodeLengthRule implements WeightedLevelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedLevelSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedLevelSnapshotDurationMinutesRangeRule implements WeightedLevelSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedLevelSnapshot): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedLevelSnapshotCodePrefixRule implements WeightedLevelSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedLevelSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedLevelSnapshotRequiredCodeRule implements WeightedLevelSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedLevelSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedLevelSnapshotRequiredLabelRule implements WeightedLevelSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedLevelSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted level snapshot. */
export class WeightedLevelSnapshotValidator {
  rules: WeightedLevelSnapshotRule[];

  constructor(rules: WeightedLevelSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedLevelSnapshot): string[] {
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

  requireValid(item: WeightedLevelSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedLevelSnapshot[]): Map<string, string[]> {
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

export function defaultWeightedLevelSnapshotValidator(): WeightedLevelSnapshotValidator {
  return new WeightedLevelSnapshotValidator(
    [
      new WeightedLevelSnapshotAudienceIdLengthRule(16),
      new WeightedLevelSnapshotCodeLengthRule(16),
      new WeightedLevelSnapshotDurationMinutesRangeRule(80, 3600),
      new WeightedLevelSnapshotCodePrefixRule("X"),
      new WeightedLevelSnapshotRequiredCodeRule("weighted level snapshot needs a value"),
      new WeightedLevelSnapshotRequiredLabelRule("weighted level snapshot needs a value"),
    ],
  );
}
