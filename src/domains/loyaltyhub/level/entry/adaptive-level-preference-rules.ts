import { AdaptiveLevelPreference } from "./adaptive-level-preference.js";

/** A rule a adaptive level preference must pass. Check returns its problems, or none. */
export interface AdaptiveLevelPreferenceRule {
  check(item: AdaptiveLevelPreference): string[];
}

export class AdaptiveLevelPreferenceRequiredTitleRule implements AdaptiveLevelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLevelPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLevelPreferenceRequiredLocaleRule implements AdaptiveLevelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLevelPreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLevelPreferenceCodePrefixRule implements AdaptiveLevelPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveLevelPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveLevelPreferenceMarginRangeRule implements AdaptiveLevelPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveLevelPreference): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive level preference. */
export class AdaptiveLevelPreferenceValidator {
  rules: AdaptiveLevelPreferenceRule[];

  constructor(rules: AdaptiveLevelPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveLevelPreference): string[] {
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

  requireValid(item: AdaptiveLevelPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveLevelPreference[]): Map<string, string[]> {
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

export function defaultAdaptiveLevelPreferenceValidator(): AdaptiveLevelPreferenceValidator {
  return new AdaptiveLevelPreferenceValidator(
    [
      new AdaptiveLevelPreferenceRequiredTitleRule("adaptive level preference needs this field"),
      new AdaptiveLevelPreferenceRequiredLocaleRule("adaptive level preference needs this field"),
      new AdaptiveLevelPreferenceCodePrefixRule("ACM"),
      new AdaptiveLevelPreferenceMarginRangeRule(4.5, 4465.3),
    ],
  );
}
