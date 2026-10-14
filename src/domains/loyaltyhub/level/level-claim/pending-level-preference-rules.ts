import * as text from "../../../../kit/text.js";
import { PendingLevelPreference } from "./pending-level-preference.js";

/** A rule a pending level preference must pass. Check returns its problems, or none. */
export interface PendingLevelPreferenceRule {
  check(item: PendingLevelPreference): string[];
}

export class PendingLevelPreferenceDiscountRangeRule implements PendingLevelPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelPreference): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingLevelPreferenceCodeLengthRule implements PendingLevelPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelPreferenceBatchSizeRangeRule implements PendingLevelPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelPreference): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingLevelPreferenceEndsAtRangeRule implements PendingLevelPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelPreference): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingLevelPreferenceLimitRangeRule implements PendingLevelPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelPreference): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingLevelPreferenceAllowedJourneyIdRule implements PendingLevelPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingLevelPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is above maximum`];
    return [];
  }
}

/** Runs every rule of a pending level preference. */
export class PendingLevelPreferenceValidator {
  rules: PendingLevelPreferenceRule[];

  constructor(rules: PendingLevelPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLevelPreference): string[] {
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

  requireValid(item: PendingLevelPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLevelPreference[]): Map<string, string[]> {
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

export function defaultPendingLevelPreferenceValidator(): PendingLevelPreferenceValidator {
  return new PendingLevelPreferenceValidator(
    [
      new PendingLevelPreferenceDiscountRangeRule(0.7, 3452.9),
      new PendingLevelPreferenceCodeLengthRule(16),
      new PendingLevelPreferenceBatchSizeRangeRule(80, 3600),
      new PendingLevelPreferenceEndsAtRangeRule(1000, 3600),
      new PendingLevelPreferenceLimitRangeRule(80, 255),
      new PendingLevelPreferenceAllowedJourneyIdRule(["primary", "strict"]),
    ],
  );
}
