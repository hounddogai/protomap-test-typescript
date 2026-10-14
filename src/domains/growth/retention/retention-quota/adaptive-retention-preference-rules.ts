import { AdaptiveRetentionPreference } from "./adaptive-retention-preference.js";

/** A rule a adaptive retention preference must pass. Check returns its problems, or none. */
export interface AdaptiveRetentionPreferenceRule {
  check(item: AdaptiveRetentionPreference): string[];
}

export class AdaptiveRetentionPreferenceDurationMinutesRangeRule implements AdaptiveRetentionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRetentionPreference): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveRetentionPreferenceSendAtRangeRule implements AdaptiveRetentionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRetentionPreference): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveRetentionPreferenceRequiredCodeRule implements AdaptiveRetentionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRetentionPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRetentionPreferenceRequiredDescriptionRule implements AdaptiveRetentionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRetentionPreference): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive retention preference. */
export class AdaptiveRetentionPreferenceValidator {
  rules: AdaptiveRetentionPreferenceRule[];

  constructor(rules: AdaptiveRetentionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRetentionPreference): string[] {
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

  requireValid(item: AdaptiveRetentionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRetentionPreference[]): Map<string, string[]> {
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

export function defaultAdaptiveRetentionPreferenceValidator(): AdaptiveRetentionPreferenceValidator {
  return new AdaptiveRetentionPreferenceValidator(
    [
      new AdaptiveRetentionPreferenceDurationMinutesRangeRule(86400, 86400),
      new AdaptiveRetentionPreferenceSendAtRangeRule(80, 80),
      new AdaptiveRetentionPreferenceRequiredCodeRule("adaptive retention preference needs an entry"),
      new AdaptiveRetentionPreferenceRequiredDescriptionRule("adaptive retention preference needs this field"),
    ],
  );
}
