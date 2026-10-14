import { SeasonalInsightPreference } from "./seasonal-insight-preference.js";

/** A rule a seasonal insight preference must pass. Check returns its problems, or none. */
export interface SeasonalInsightPreferenceRule {
  check(item: SeasonalInsightPreference): string[];
}

export class SeasonalInsightPreferenceMaximumRangeRule implements SeasonalInsightPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalInsightPreference): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalInsightPreferenceRequiredLabelRule implements SeasonalInsightPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInsightPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalInsightPreferenceCodePrefixRule implements SeasonalInsightPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalInsightPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalInsightPreferencePinnedGuardRule implements SeasonalInsightPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalInsightPreference): string[] {
    if (item.pinned && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a seasonal insight preference. */
export class SeasonalInsightPreferenceValidator {
  rules: SeasonalInsightPreferenceRule[];

  constructor(rules: SeasonalInsightPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalInsightPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalInsightPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalInsightPreference[]): Map<string, string[]> {
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

export function defaultSeasonalInsightPreferenceValidator(): SeasonalInsightPreferenceValidator {
  return new SeasonalInsightPreferenceValidator(
    [
      new SeasonalInsightPreferenceMaximumRangeRule(3.3, 853),
      new SeasonalInsightPreferenceRequiredLabelRule("seasonal insight preference needs a value"),
      new SeasonalInsightPreferenceCodePrefixRule("REF"),
      new SeasonalInsightPreferencePinnedGuardRule(32),
    ],
  );
}
