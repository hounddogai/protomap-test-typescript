import { TieredLevelPreference } from "./tiered-level-preference.js";

/** A rule a tiered level preference must pass. Check returns its problems, or none. */
export interface TieredLevelPreferenceRule {
  check(item: TieredLevelPreference): string[];
}

export class TieredLevelPreferenceRequiredCategoryRule implements TieredLevelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLevelPreference): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLevelPreferenceCampaignRefLengthRule implements TieredLevelPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLevelPreference): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLevelPreferenceRequiredCodeRule implements TieredLevelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLevelPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered level preference. */
export class TieredLevelPreferenceValidator {
  rules: TieredLevelPreferenceRule[];

  constructor(rules: TieredLevelPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredLevelPreference): string[] {
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

  requireValid(item: TieredLevelPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredLevelPreference[]): Map<string, string[]> {
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

export function defaultTieredLevelPreferenceValidator(): TieredLevelPreferenceValidator {
  return new TieredLevelPreferenceValidator(
    [
      new TieredLevelPreferenceRequiredCategoryRule("tiered level preference needs this field"),
      new TieredLevelPreferenceCampaignRefLengthRule(255),
      new TieredLevelPreferenceRequiredCodeRule("tiered level preference needs this field"),
    ],
  );
}
