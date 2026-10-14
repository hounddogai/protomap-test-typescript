import * as text from "../../../../kit/text.js";
import { ScheduledSlaPreference } from "./scheduled-sla-preference.js";

/** A rule a scheduled sla preference must pass. Check returns its problems, or none. */
export interface ScheduledSlaPreferenceRule {
  check(item: ScheduledSlaPreference): string[];
}

export class ScheduledSlaPreferenceAmountRangeRule implements ScheduledSlaPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSlaPreference): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledSlaPreferenceAllowedContactEmailRule implements ScheduledSlaPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSlaPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is duplicated`];
    return [];
  }
}

export class ScheduledSlaPreferenceUtmSourceLengthRule implements ScheduledSlaPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSlaPreference): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSlaPreferenceRequiredContactEmailRule implements ScheduledSlaPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSlaPreference): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSlaPreferenceNameLengthRule implements ScheduledSlaPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSlaPreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled sla preference. */
export class ScheduledSlaPreferenceValidator {
  rules: ScheduledSlaPreferenceRule[];

  constructor(rules: ScheduledSlaPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSlaPreference): string[] {
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

  requireValid(item: ScheduledSlaPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSlaPreference[]): Map<string, string[]> {
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

export function defaultScheduledSlaPreferenceValidator(): ScheduledSlaPreferenceValidator {
  return new ScheduledSlaPreferenceValidator(
    [
      new ScheduledSlaPreferenceAmountRangeRule(0.6, 422.7),
      new ScheduledSlaPreferenceAllowedContactEmailRule(["manual", "weighted"]),
      new ScheduledSlaPreferenceUtmSourceLengthRule(120),
      new ScheduledSlaPreferenceRequiredContactEmailRule("scheduled sla preference needs an entry"),
      new ScheduledSlaPreferenceNameLengthRule(86400),
    ],
  );
}
