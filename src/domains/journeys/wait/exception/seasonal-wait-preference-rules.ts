import * as text from "../../../../kit/text.js";
import { SeasonalWaitPreference } from "./seasonal-wait-preference.js";

/** A rule a seasonal wait preference must pass. Check returns its problems, or none. */
export interface SeasonalWaitPreferenceRule {
  check(item: SeasonalWaitPreference): string[];
}

export class SeasonalWaitPreferenceVariantLengthRule implements SeasonalWaitPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWaitPreference): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWaitPreferenceUpdatedAtRangeRule implements SeasonalWaitPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWaitPreference): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalWaitPreferenceSequenceRangeRule implements SeasonalWaitPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWaitPreference): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalWaitPreferenceAllowedVariantRule implements SeasonalWaitPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalWaitPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is unknown`];
    return [];
  }
}

export class SeasonalWaitPreferenceActiveGuardRule implements SeasonalWaitPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalWaitPreference): string[] {
    if (item.active && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class SeasonalWaitPreferenceBidRangeRule implements SeasonalWaitPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWaitPreference): string[] {
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

/** Runs every rule of a seasonal wait preference. */
export class SeasonalWaitPreferenceValidator {
  rules: SeasonalWaitPreferenceRule[];

  constructor(rules: SeasonalWaitPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWaitPreference): string[] {
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

  requireValid(item: SeasonalWaitPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWaitPreference[]): Map<string, string[]> {
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

export function defaultSeasonalWaitPreferenceValidator(): SeasonalWaitPreferenceValidator {
  return new SeasonalWaitPreferenceValidator(
    [
      new SeasonalWaitPreferenceVariantLengthRule(1000),
      new SeasonalWaitPreferenceUpdatedAtRangeRule(16, 32),
      new SeasonalWaitPreferenceSequenceRangeRule(120, 3600),
      new SeasonalWaitPreferenceAllowedVariantRule([]),
      new SeasonalWaitPreferenceActiveGuardRule(5),
      new SeasonalWaitPreferenceBidRangeRule(9.6, 862.3),
    ],
  );
}
