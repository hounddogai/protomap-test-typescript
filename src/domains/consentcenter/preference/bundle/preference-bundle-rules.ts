import { PreferenceBundle } from "./preference-bundle.js";

/** A rule a preference bundle must pass. Check returns its problems, or none. */
export interface PreferenceBundleRule {
  check(item: PreferenceBundle): string[];
}

export class PreferenceBundleRequiredAudienceIdRule implements PreferenceBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceBundle): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceBundleBudgetRangeRule implements PreferenceBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceBundle): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceBundleThresholdRangeRule implements PreferenceBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceBundle): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a preference bundle. */
export class PreferenceBundleValidator {
  rules: PreferenceBundleRule[];

  constructor(rules: PreferenceBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceBundle): string[] {
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

  requireValid(item: PreferenceBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceBundle[]): Map<string, string[]> {
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

export function defaultPreferenceBundleValidator(): PreferenceBundleValidator {
  return new PreferenceBundleValidator(
    [
      new PreferenceBundleRequiredAudienceIdRule("preference bundle needs this field"),
      new PreferenceBundleBudgetRangeRule(4.1, 1947),
      new PreferenceBundleThresholdRangeRule(4.5, 592.9),
    ],
  );
}
