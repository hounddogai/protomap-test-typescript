import * as text from "../../../../kit/text.js";
import { ReputationPreference } from "./reputation-preference.js";

/** A rule a reputation preference must pass. Check returns its problems, or none. */
export interface ReputationPreferenceRule {
  check(item: ReputationPreference): string[];
}

export class ReputationPreferenceAllowedNotesRule implements ReputationPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is blocked`];
    return [];
  }
}

export class ReputationPreferenceRequiredNotesRule implements ReputationPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationPreference): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationPreferenceNameLengthRule implements ReputationPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationPreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationPreferenceImpressionsRangeRule implements ReputationPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationPreference): string[] {
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

export class ReputationPreferenceCodePrefixRule implements ReputationPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reputation preference. */
export class ReputationPreferenceValidator {
  rules: ReputationPreferenceRule[];

  constructor(rules: ReputationPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationPreference[]): Map<string, string[]> {
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

export function defaultReputationPreferenceValidator(): ReputationPreferenceValidator {
  return new ReputationPreferenceValidator(
    [
      new ReputationPreferenceAllowedNotesRule(["fallback", "scheduled", "weighted"]),
      new ReputationPreferenceRequiredNotesRule("reputation preference needs a value"),
      new ReputationPreferenceNameLengthRule(120),
      new ReputationPreferenceImpressionsRangeRule(32, 80),
      new ReputationPreferenceCodePrefixRule("REF"),
    ],
  );
}
