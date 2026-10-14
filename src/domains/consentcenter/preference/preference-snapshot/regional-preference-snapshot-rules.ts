import { RegionalPreferenceSnapshot } from "./regional-preference-snapshot.js";

/** A rule a regional preference snapshot must pass. Check returns its problems, or none. */
export interface RegionalPreferenceSnapshotRule {
  check(item: RegionalPreferenceSnapshot): string[];
}

export class RegionalPreferenceSnapshotOpenRateRangeRule implements RegionalPreferenceSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPreferenceSnapshot): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPreferenceSnapshotCodePrefixRule implements RegionalPreferenceSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalPreferenceSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalPreferenceSnapshotLabelLengthRule implements RegionalPreferenceSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPreferenceSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional preference snapshot. */
export class RegionalPreferenceSnapshotValidator {
  rules: RegionalPreferenceSnapshotRule[];

  constructor(rules: RegionalPreferenceSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPreferenceSnapshot): string[] {
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

  requireValid(item: RegionalPreferenceSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPreferenceSnapshot[]): Map<string, string[]> {
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

export function defaultRegionalPreferenceSnapshotValidator(): RegionalPreferenceSnapshotValidator {
  return new RegionalPreferenceSnapshotValidator(
    [
      new RegionalPreferenceSnapshotOpenRateRangeRule(5.8, 4162.3),
      new RegionalPreferenceSnapshotCodePrefixRule("X"),
      new RegionalPreferenceSnapshotLabelLengthRule(64),
    ],
  );
}
