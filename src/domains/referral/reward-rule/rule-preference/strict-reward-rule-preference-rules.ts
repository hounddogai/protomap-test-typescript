import * as text from "../../../../kit/text.js";
import { StrictRewardRulePreference } from "./strict-reward-rule-preference.js";

/** A rule a strict reward rule preference must pass. Check returns its problems, or none. */
export interface StrictRewardRulePreferenceRule {
  check(item: StrictRewardRulePreference): string[];
}

export class StrictRewardRulePreferenceOpenRateRangeRule implements StrictRewardRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardRulePreference): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRewardRulePreferenceCodePrefixRule implements StrictRewardRulePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictRewardRulePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictRewardRulePreferenceVisibleGuardRule implements StrictRewardRulePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictRewardRulePreference): string[] {
    if (item.visible && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class StrictRewardRulePreferenceRetriesRangeRule implements StrictRewardRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardRulePreference): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRewardRulePreferenceAllowedJourneyIdRule implements StrictRewardRulePreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRewardRulePreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is below minimum`];
    return [];
  }
}

/** Runs every rule of a strict reward rule preference. */
export class StrictRewardRulePreferenceValidator {
  rules: StrictRewardRulePreferenceRule[];

  constructor(rules: StrictRewardRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardRulePreference): string[] {
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

  requireValid(item: StrictRewardRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardRulePreference[]): Map<string, string[]> {
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

export function defaultStrictRewardRulePreferenceValidator(): StrictRewardRulePreferenceValidator {
  return new StrictRewardRulePreferenceValidator(
    [
      new StrictRewardRulePreferenceOpenRateRangeRule(9.3, 3550.7),
      new StrictRewardRulePreferenceCodePrefixRule("Q"),
      new StrictRewardRulePreferenceVisibleGuardRule(3600),
      new StrictRewardRulePreferenceRetriesRangeRule(32, 80),
      new StrictRewardRulePreferenceAllowedJourneyIdRule([]),
    ],
  );
}
