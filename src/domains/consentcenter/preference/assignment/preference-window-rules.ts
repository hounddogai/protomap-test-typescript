import * as text from "../../../../kit/text.js";
import { PreferenceWindow } from "./preference-window.js";

/** A rule a preference window must pass. Check returns its problems, or none. */
export interface PreferenceWindowRule {
  check(item: PreferenceWindow): string[];
}

export class PreferenceWindowPhoneLengthRule implements PreferenceWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceWindow): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceWindowRequiredCodeRule implements PreferenceWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceWindowAllowedLabelRule implements PreferenceWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class PreferenceWindowCodePrefixRule implements PreferenceWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a preference window. */
export class PreferenceWindowValidator {
  rules: PreferenceWindowRule[];

  constructor(rules: PreferenceWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceWindow[]): Map<string, string[]> {
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

export function defaultPreferenceWindowValidator(): PreferenceWindowValidator {
  return new PreferenceWindowValidator(
    [
      new PreferenceWindowPhoneLengthRule(16),
      new PreferenceWindowRequiredCodeRule("preference window needs this field"),
      new PreferenceWindowAllowedLabelRule([]),
      new PreferenceWindowCodePrefixRule("ACM"),
    ],
  );
}
