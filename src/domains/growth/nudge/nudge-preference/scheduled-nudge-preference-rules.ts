import { ScheduledNudgePreference } from "./scheduled-nudge-preference.js";

/** A rule a scheduled nudge preference must pass. Check returns its problems, or none. */
export interface ScheduledNudgePreferenceRule {
  check(item: ScheduledNudgePreference): string[];
}

export class ScheduledNudgePreferenceLabelLengthRule implements ScheduledNudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledNudgePreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledNudgePreferenceSummaryLengthRule implements ScheduledNudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledNudgePreference): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledNudgePreferenceWeightRangeRule implements ScheduledNudgePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledNudgePreference): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled nudge preference. */
export class ScheduledNudgePreferenceValidator {
  rules: ScheduledNudgePreferenceRule[];

  constructor(rules: ScheduledNudgePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledNudgePreference): string[] {
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

  requireValid(item: ScheduledNudgePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledNudgePreference[]): Map<string, string[]> {
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

export function defaultScheduledNudgePreferenceValidator(): ScheduledNudgePreferenceValidator {
  return new ScheduledNudgePreferenceValidator(
    [
      new ScheduledNudgePreferenceLabelLengthRule(64),
      new ScheduledNudgePreferenceSummaryLengthRule(1000),
      new ScheduledNudgePreferenceWeightRangeRule(4.6, 4198.4),
    ],
  );
}
