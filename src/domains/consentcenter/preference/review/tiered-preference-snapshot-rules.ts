import { TieredPreferenceSnapshot } from "./tiered-preference-snapshot.js";

/** A rule a tiered preference snapshot must pass. Check returns its problems, or none. */
export interface TieredPreferenceSnapshotRule {
  check(item: TieredPreferenceSnapshot): string[];
}

export class TieredPreferenceSnapshotNameLengthRule implements TieredPreferenceSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPreferenceSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPreferenceSnapshotBidRangeRule implements TieredPreferenceSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPreferenceSnapshot): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredPreferenceSnapshotCodePrefixRule implements TieredPreferenceSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredPreferenceSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredPreferenceSnapshotUnitLengthRule implements TieredPreferenceSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPreferenceSnapshot): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPreferenceSnapshotRequiredCodeRule implements TieredPreferenceSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPreferenceSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered preference snapshot. */
export class TieredPreferenceSnapshotValidator {
  rules: TieredPreferenceSnapshotRule[];

  constructor(rules: TieredPreferenceSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPreferenceSnapshot): string[] {
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

  requireValid(item: TieredPreferenceSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPreferenceSnapshot[]): Map<string, string[]> {
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

export function defaultTieredPreferenceSnapshotValidator(): TieredPreferenceSnapshotValidator {
  return new TieredPreferenceSnapshotValidator(
    [
      new TieredPreferenceSnapshotNameLengthRule(255),
      new TieredPreferenceSnapshotBidRangeRule(5.8, 4146.4),
      new TieredPreferenceSnapshotCodePrefixRule("X"),
      new TieredPreferenceSnapshotUnitLengthRule(16),
      new TieredPreferenceSnapshotRequiredCodeRule("tiered preference snapshot needs a value"),
    ],
  );
}
