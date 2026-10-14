import * as text from "../../../../kit/text.js";
import { FallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

/** A rule a fallback bid rule preference must pass. Check returns its problems, or none. */
export interface FallbackBidRulePreferenceRule {
  check(item: FallbackBidRulePreference): string[];
}

export class FallbackBidRulePreferenceAllowedCohortRule implements FallbackBidRulePreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackBidRulePreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is out of range`];
    return [];
  }
}

export class FallbackBidRulePreferenceCodeLengthRule implements FallbackBidRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRulePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBidRulePreferenceActiveGuardRule implements FallbackBidRulePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackBidRulePreference): string[] {
    if (item.active && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while active`];
    return [];
  }
}

export class FallbackBidRulePreferenceRequiredNameRule implements FallbackBidRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBidRulePreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback bid rule preference. */
export class FallbackBidRulePreferenceValidator {
  rules: FallbackBidRulePreferenceRule[];

  constructor(rules: FallbackBidRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBidRulePreference): string[] {
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

  requireValid(item: FallbackBidRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBidRulePreference[]): Map<string, string[]> {
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

export function defaultFallbackBidRulePreferenceValidator(): FallbackBidRulePreferenceValidator {
  return new FallbackBidRulePreferenceValidator(
    [
      new FallbackBidRulePreferenceAllowedCohortRule(["manual", "tiered"]),
      new FallbackBidRulePreferenceCodeLengthRule(255),
      new FallbackBidRulePreferenceActiveGuardRule(5.4),
      new FallbackBidRulePreferenceRequiredNameRule("fallback bid rule preference needs a value"),
    ],
  );
}
