import { SeasonalExitRulePreference } from "./seasonal-exit-rule-preference.js";

/** A rule a seasonal exit rule preference must pass. Check returns its problems, or none. */
export interface SeasonalExitRulePreferenceRule {
  check(item: SeasonalExitRulePreference): string[];
}

export class SeasonalExitRulePreferencePinnedGuardRule implements SeasonalExitRulePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalExitRulePreference): string[] {
    if (item.pinned && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class SeasonalExitRulePreferenceCampaignRefLengthRule implements SeasonalExitRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalExitRulePreference): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalExitRulePreferenceRequiredLocaleRule implements SeasonalExitRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalExitRulePreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalExitRulePreferenceRequiredTitleRule implements SeasonalExitRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalExitRulePreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalExitRulePreferenceLocaleLengthRule implements SeasonalExitRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalExitRulePreference): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal exit rule preference. */
export class SeasonalExitRulePreferenceValidator {
  rules: SeasonalExitRulePreferenceRule[];

  constructor(rules: SeasonalExitRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalExitRulePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalExitRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalExitRulePreference[]): Map<string, string[]> {
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

export function defaultSeasonalExitRulePreferenceValidator(): SeasonalExitRulePreferenceValidator {
  return new SeasonalExitRulePreferenceValidator(
    [
      new SeasonalExitRulePreferencePinnedGuardRule(16),
      new SeasonalExitRulePreferenceCampaignRefLengthRule(16),
      new SeasonalExitRulePreferenceRequiredLocaleRule("seasonal exit rule preference needs this field"),
      new SeasonalExitRulePreferenceRequiredTitleRule("seasonal exit rule preference needs this field"),
      new SeasonalExitRulePreferenceLocaleLengthRule(120),
    ],
  );
}
