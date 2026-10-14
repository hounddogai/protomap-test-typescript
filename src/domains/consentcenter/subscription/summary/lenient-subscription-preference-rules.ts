import * as text from "../../../../kit/text.js";
import { LenientSubscriptionPreference } from "./lenient-subscription-preference.js";

/** A rule a lenient subscription preference must pass. Check returns its problems, or none. */
export interface LenientSubscriptionPreferenceRule {
  check(item: LenientSubscriptionPreference): string[];
}

export class LenientSubscriptionPreferenceAllowedTitleRule implements LenientSubscriptionPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientSubscriptionPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class LenientSubscriptionPreferenceRevisionRangeRule implements LenientSubscriptionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSubscriptionPreference): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientSubscriptionPreferenceRequiredCodeRule implements LenientSubscriptionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSubscriptionPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSubscriptionPreferenceFrequencyCapRangeRule implements LenientSubscriptionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSubscriptionPreference): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient subscription preference. */
export class LenientSubscriptionPreferenceValidator {
  rules: LenientSubscriptionPreferenceRule[];

  constructor(rules: LenientSubscriptionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSubscriptionPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientSubscriptionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSubscriptionPreference[]): Map<string, string[]> {
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

export function defaultLenientSubscriptionPreferenceValidator(): LenientSubscriptionPreferenceValidator {
  return new LenientSubscriptionPreferenceValidator(
    [
      new LenientSubscriptionPreferenceAllowedTitleRule(["batched", "lenient", "fallback"]),
      new LenientSubscriptionPreferenceRevisionRangeRule(32, 255),
      new LenientSubscriptionPreferenceRequiredCodeRule("lenient subscription preference needs a value"),
      new LenientSubscriptionPreferenceFrequencyCapRangeRule(32, 3600),
    ],
  );
}
