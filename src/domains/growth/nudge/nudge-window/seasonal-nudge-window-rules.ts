import { SeasonalNudgeWindow } from "./seasonal-nudge-window.js";

/** A rule a seasonal nudge window must pass. Check returns its problems, or none. */
export interface SeasonalNudgeWindowRule {
  check(item: SeasonalNudgeWindow): string[];
}

export class SeasonalNudgeWindowRequiredTitleRule implements SeasonalNudgeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalNudgeWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalNudgeWindowApprovedGuardRule implements SeasonalNudgeWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalNudgeWindow): string[] {
    if (item.approved && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class SeasonalNudgeWindowRequiredRegionRule implements SeasonalNudgeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalNudgeWindow): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalNudgeWindowGraceDaysRangeRule implements SeasonalNudgeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalNudgeWindow): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalNudgeWindowRequiredPhoneRule implements SeasonalNudgeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalNudgeWindow): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalNudgeWindowRetriesRangeRule implements SeasonalNudgeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalNudgeWindow): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal nudge window. */
export class SeasonalNudgeWindowValidator {
  rules: SeasonalNudgeWindowRule[];

  constructor(rules: SeasonalNudgeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalNudgeWindow): string[] {
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

  requireValid(item: SeasonalNudgeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalNudgeWindow[]): Map<string, string[]> {
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

export function defaultSeasonalNudgeWindowValidator(): SeasonalNudgeWindowValidator {
  return new SeasonalNudgeWindowValidator(
    [
      new SeasonalNudgeWindowRequiredTitleRule("seasonal nudge window needs an entry"),
      new SeasonalNudgeWindowApprovedGuardRule(4.1),
      new SeasonalNudgeWindowRequiredRegionRule("seasonal nudge window needs an entry"),
      new SeasonalNudgeWindowGraceDaysRangeRule(64, 120),
      new SeasonalNudgeWindowRequiredPhoneRule("seasonal nudge window needs this field"),
      new SeasonalNudgeWindowRetriesRangeRule(64, 1000),
    ],
  );
}
