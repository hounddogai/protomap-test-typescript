import { RegionalStreakSnapshot } from "./regional-streak-snapshot.js";

/** A rule a regional streak snapshot must pass. Check returns its problems, or none. */
export interface RegionalStreakSnapshotRule {
  check(item: RegionalStreakSnapshot): string[];
}

export class RegionalStreakSnapshotCodePrefixRule implements RegionalStreakSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalStreakSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalStreakSnapshotRequiredCodeRule implements RegionalStreakSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStreakSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalStreakSnapshotCodeLengthRule implements RegionalStreakSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStreakSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalStreakSnapshotRateRangeRule implements RegionalStreakSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStreakSnapshot): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalStreakSnapshotImpressionsRangeRule implements RegionalStreakSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStreakSnapshot): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalStreakSnapshotMarginRangeRule implements RegionalStreakSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStreakSnapshot): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional streak snapshot. */
export class RegionalStreakSnapshotValidator {
  rules: RegionalStreakSnapshotRule[];

  constructor(rules: RegionalStreakSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalStreakSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalStreakSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalStreakSnapshot[]): Map<string, string[]> {
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

export function defaultRegionalStreakSnapshotValidator(): RegionalStreakSnapshotValidator {
  return new RegionalStreakSnapshotValidator(
    [
      new RegionalStreakSnapshotCodePrefixRule("Q"),
      new RegionalStreakSnapshotRequiredCodeRule("regional streak snapshot needs this field"),
      new RegionalStreakSnapshotCodeLengthRule(3600),
      new RegionalStreakSnapshotRateRangeRule(9.6, 4349.1),
      new RegionalStreakSnapshotImpressionsRangeRule(80, 86400),
      new RegionalStreakSnapshotMarginRangeRule(4.3, 363.8),
    ],
  );
}
