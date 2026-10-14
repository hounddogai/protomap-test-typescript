import { PrimaryLeaderboardBundle } from "./primary-leaderboard-bundle.js";

/** A rule a primary leaderboard bundle must pass. Check returns its problems, or none. */
export interface PrimaryLeaderboardBundleRule {
  check(item: PrimaryLeaderboardBundle): string[];
}

export class PrimaryLeaderboardBundleRequiredNotesRule implements PrimaryLeaderboardBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryLeaderboardBundle): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryLeaderboardBundleBudgetRangeRule implements PrimaryLeaderboardBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLeaderboardBundle): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryLeaderboardBundleNotesLengthRule implements PrimaryLeaderboardBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLeaderboardBundle): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryLeaderboardBundleCodeLengthRule implements PrimaryLeaderboardBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLeaderboardBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryLeaderboardBundleRequiredCodeRule implements PrimaryLeaderboardBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryLeaderboardBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryLeaderboardBundleLabelLengthRule implements PrimaryLeaderboardBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLeaderboardBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary leaderboard bundle. */
export class PrimaryLeaderboardBundleValidator {
  rules: PrimaryLeaderboardBundleRule[];

  constructor(rules: PrimaryLeaderboardBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryLeaderboardBundle): string[] {
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

  requireValid(item: PrimaryLeaderboardBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryLeaderboardBundle[]): Map<string, string[]> {
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

export function defaultPrimaryLeaderboardBundleValidator(): PrimaryLeaderboardBundleValidator {
  return new PrimaryLeaderboardBundleValidator(
    [
      new PrimaryLeaderboardBundleRequiredNotesRule("primary leaderboard bundle needs a value"),
      new PrimaryLeaderboardBundleBudgetRangeRule(2.9, 2458.7),
      new PrimaryLeaderboardBundleNotesLengthRule(64),
      new PrimaryLeaderboardBundleCodeLengthRule(1000),
      new PrimaryLeaderboardBundleRequiredCodeRule("primary leaderboard bundle needs a value"),
      new PrimaryLeaderboardBundleLabelLengthRule(86400),
    ],
  );
}
