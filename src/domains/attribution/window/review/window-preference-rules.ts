import * as text from "../../../../kit/text.js";
import { WindowPreference } from "./window-preference.js";

/** A rule a window preference must pass. Check returns its problems, or none. */
export interface WindowPreferenceRule {
  check(item: WindowPreference): string[];
}

export class WindowPreferenceCodePrefixRule implements WindowPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowPreferenceAllowedOwnerIdRule implements WindowPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is above maximum`];
    return [];
  }
}

export class WindowPreferenceLabelLengthRule implements WindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowPreferenceQuantityRangeRule implements WindowPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowPreference): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a window preference. */
export class WindowPreferenceValidator {
  rules: WindowPreferenceRule[];

  constructor(rules: WindowPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: WindowPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowPreference[]): Map<string, string[]> {
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

export function defaultWindowPreferenceValidator(): WindowPreferenceValidator {
  return new WindowPreferenceValidator(
    [
      new WindowPreferenceCodePrefixRule("X"),
      new WindowPreferenceAllowedOwnerIdRule(["strict", "default"]),
      new WindowPreferenceLabelLengthRule(1000),
      new WindowPreferenceQuantityRangeRule(32, 3600),
    ],
  );
}
