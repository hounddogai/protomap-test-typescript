import * as text from "../../../../kit/text.js";
import { LenientPreferenceBaseline } from "./lenient-preference-baseline.js";

/** A rule a lenient preference baseline must pass. Check returns its problems, or none. */
export interface LenientPreferenceBaselineRule {
  check(item: LenientPreferenceBaseline): string[];
}

export class LenientPreferenceBaselineCodePrefixRule implements LenientPreferenceBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPreferenceBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientPreferenceBaselineAllowedNotesRule implements LenientPreferenceBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPreferenceBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is blocked`];
    return [];
  }
}

export class LenientPreferenceBaselineDescriptionLengthRule implements LenientPreferenceBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPreferenceBaseline): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPreferenceBaselineRequiredNotesRule implements LenientPreferenceBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPreferenceBaseline): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient preference baseline. */
export class LenientPreferenceBaselineValidator {
  rules: LenientPreferenceBaselineRule[];

  constructor(rules: LenientPreferenceBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPreferenceBaseline): string[] {
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

  requireValid(item: LenientPreferenceBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPreferenceBaseline[]): Map<string, string[]> {
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

export function defaultLenientPreferenceBaselineValidator(): LenientPreferenceBaselineValidator {
  return new LenientPreferenceBaselineValidator(
    [
      new LenientPreferenceBaselineCodePrefixRule("OPS"),
      new LenientPreferenceBaselineAllowedNotesRule([]),
      new LenientPreferenceBaselineDescriptionLengthRule(255),
      new LenientPreferenceBaselineRequiredNotesRule("lenient preference baseline needs this field"),
    ],
  );
}
