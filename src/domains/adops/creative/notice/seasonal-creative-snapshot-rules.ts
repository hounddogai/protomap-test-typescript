import { SeasonalCreativeSnapshot } from "./seasonal-creative-snapshot.js";

/** A rule a seasonal creative snapshot must pass. Check returns its problems, or none. */
export interface SeasonalCreativeSnapshotRule {
  check(item: SeasonalCreativeSnapshot): string[];
}

export class SeasonalCreativeSnapshotCodeLengthRule implements SeasonalCreativeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCreativeSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalCreativeSnapshotRequiredCodeRule implements SeasonalCreativeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCreativeSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCreativeSnapshotFrequencyCapRangeRule implements SeasonalCreativeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCreativeSnapshot): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal creative snapshot. */
export class SeasonalCreativeSnapshotValidator {
  rules: SeasonalCreativeSnapshotRule[];

  constructor(rules: SeasonalCreativeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCreativeSnapshot): string[] {
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

  requireValid(item: SeasonalCreativeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCreativeSnapshot[]): Map<string, string[]> {
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

export function defaultSeasonalCreativeSnapshotValidator(): SeasonalCreativeSnapshotValidator {
  return new SeasonalCreativeSnapshotValidator(
    [
      new SeasonalCreativeSnapshotCodeLengthRule(120),
      new SeasonalCreativeSnapshotRequiredCodeRule("seasonal creative snapshot needs a value"),
      new SeasonalCreativeSnapshotFrequencyCapRangeRule(32, 86400),
    ],
  );
}
