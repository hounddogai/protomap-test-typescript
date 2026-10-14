import * as text from "../../../../kit/text.js";
import { RollingBidRulePreference } from "./rolling-bid-rule-preference.js";

/** A rule a rolling bid rule preference must pass. Check returns its problems, or none. */
export interface RollingBidRulePreferenceRule {
  check(item: RollingBidRulePreference): string[];
}

export class RollingBidRulePreferenceRequiredCodeRule implements RollingBidRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBidRulePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBidRulePreferenceImpressionsRangeRule implements RollingBidRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingBidRulePreference): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingBidRulePreferenceCodePrefixRule implements RollingBidRulePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingBidRulePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingBidRulePreferenceRequiredNameRule implements RollingBidRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBidRulePreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBidRulePreferenceRequiredTitleRule implements RollingBidRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBidRulePreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBidRulePreferenceAllowedTitleRule implements RollingBidRulePreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingBidRulePreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

/** Runs every rule of a rolling bid rule preference. */
export class RollingBidRulePreferenceValidator {
  rules: RollingBidRulePreferenceRule[];

  constructor(rules: RollingBidRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBidRulePreference): string[] {
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

  requireValid(item: RollingBidRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBidRulePreference[]): Map<string, string[]> {
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

export function defaultRollingBidRulePreferenceValidator(): RollingBidRulePreferenceValidator {
  return new RollingBidRulePreferenceValidator(
    [
      new RollingBidRulePreferenceRequiredCodeRule("rolling bid rule preference needs an entry"),
      new RollingBidRulePreferenceImpressionsRangeRule(80, 120),
      new RollingBidRulePreferenceCodePrefixRule("REF"),
      new RollingBidRulePreferenceRequiredNameRule("rolling bid rule preference needs an entry"),
      new RollingBidRulePreferenceRequiredTitleRule("rolling bid rule preference needs a value"),
      new RollingBidRulePreferenceAllowedTitleRule(["weighted", "regional", "default"]),
    ],
  );
}
