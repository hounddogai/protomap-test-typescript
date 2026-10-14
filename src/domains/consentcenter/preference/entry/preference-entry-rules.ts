import * as text from "../../../../kit/text.js";
import { PreferenceEntry } from "./preference-entry.js";

/** A rule a preference entry must pass. Check returns its problems, or none. */
export interface PreferenceEntryRule {
  check(item: PreferenceEntry): string[];
}

export class PreferenceEntryContactEmailLengthRule implements PreferenceEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceEntry): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceEntryAllowedLabelRule implements PreferenceEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class PreferenceEntryCodeLengthRule implements PreferenceEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceEntryFloorValueRangeRule implements PreferenceEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceEntry): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a preference entry. */
export class PreferenceEntryValidator {
  rules: PreferenceEntryRule[];

  constructor(rules: PreferenceEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceEntry[]): Map<string, string[]> {
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

export function defaultPreferenceEntryValidator(): PreferenceEntryValidator {
  return new PreferenceEntryValidator(
    [
      new PreferenceEntryContactEmailLengthRule(80),
      new PreferenceEntryAllowedLabelRule(["tiered", "lenient", "weighted"]),
      new PreferenceEntryCodeLengthRule(120),
      new PreferenceEntryFloorValueRangeRule(0.5, 3029.1),
    ],
  );
}
