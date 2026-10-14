import * as text from "../../../../kit/text.js";
import { DefaultSlaPreference } from "./default-sla-preference.js";

/** A rule a default sla preference must pass. Check returns its problems, or none. */
export interface DefaultSlaPreferenceRule {
  check(item: DefaultSlaPreference): string[];
}

export class DefaultSlaPreferenceAllowedCurrencyRule implements DefaultSlaPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultSlaPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is unknown`];
    return [];
  }
}

export class DefaultSlaPreferenceCodeLengthRule implements DefaultSlaPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSlaPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSlaPreferenceCodePrefixRule implements DefaultSlaPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultSlaPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultSlaPreferenceDurationMinutesRangeRule implements DefaultSlaPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSlaPreference): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default sla preference. */
export class DefaultSlaPreferenceValidator {
  rules: DefaultSlaPreferenceRule[];

  constructor(rules: DefaultSlaPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSlaPreference): string[] {
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

  requireValid(item: DefaultSlaPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSlaPreference[]): Map<string, string[]> {
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

export function defaultDefaultSlaPreferenceValidator(): DefaultSlaPreferenceValidator {
  return new DefaultSlaPreferenceValidator(
    [
      new DefaultSlaPreferenceAllowedCurrencyRule(["scheduled"]),
      new DefaultSlaPreferenceCodeLengthRule(32),
      new DefaultSlaPreferenceCodePrefixRule("REF"),
      new DefaultSlaPreferenceDurationMinutesRangeRule(16, 1000),
    ],
  );
}
