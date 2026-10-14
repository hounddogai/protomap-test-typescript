import * as text from "../../../../kit/text.js";
import { CsatPreference } from "./csat-preference.js";

/** A rule a csat preference must pass. Check returns its problems, or none. */
export interface CsatPreferenceRule {
  check(item: CsatPreference): string[];
}

export class CsatPreferenceQuantityRangeRule implements CsatPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatPreference): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatPreferenceAllowedChannelRule implements CsatPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is too long`];
    return [];
  }
}

export class CsatPreferenceRequiredLabelRule implements CsatPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CsatPreferenceRequiredChannelRule implements CsatPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatPreference): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CsatPreferenceChannelLengthRule implements CsatPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatPreference): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat preference. */
export class CsatPreferenceValidator {
  rules: CsatPreferenceRule[];

  constructor(rules: CsatPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: CsatPreference): string[] {
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

  requireValid(item: CsatPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatPreference[]): Map<string, string[]> {
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

export function defaultCsatPreferenceValidator(): CsatPreferenceValidator {
  return new CsatPreferenceValidator(
    [
      new CsatPreferenceQuantityRangeRule(1000, 1000),
      new CsatPreferenceAllowedChannelRule(["weighted", "adaptive", "legacy"]),
      new CsatPreferenceRequiredLabelRule("csat preference needs a value"),
      new CsatPreferenceRequiredChannelRule("csat preference needs this field"),
      new CsatPreferenceChannelLengthRule(64),
    ],
  );
}
