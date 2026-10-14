import * as text from "../../../../kit/text.js";
import { RewardPreference } from "./reward-preference.js";

/** A rule a reward preference must pass. Check returns its problems, or none. */
export interface RewardPreferenceRule {
  check(item: RewardPreference): string[];
}

export class RewardPreferenceNameLengthRule implements RewardPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardPreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardPreferenceRequiredNameRule implements RewardPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardPreferenceAllowedNameRule implements RewardPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class RewardPreferenceRequiredCodeRule implements RewardPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardPreferenceCreatedAtRangeRule implements RewardPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardPreference): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward preference. */
export class RewardPreferenceValidator {
  rules: RewardPreferenceRule[];

  constructor(rules: RewardPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RewardPreference): string[] {
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

  requireValid(item: RewardPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardPreference[]): Map<string, string[]> {
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

export function defaultRewardPreferenceValidator(): RewardPreferenceValidator {
  return new RewardPreferenceValidator(
    [
      new RewardPreferenceNameLengthRule(80),
      new RewardPreferenceRequiredNameRule("reward preference needs a value"),
      new RewardPreferenceAllowedNameRule([]),
      new RewardPreferenceRequiredCodeRule("reward preference needs an entry"),
      new RewardPreferenceCreatedAtRangeRule(16, 1000),
    ],
  );
}
