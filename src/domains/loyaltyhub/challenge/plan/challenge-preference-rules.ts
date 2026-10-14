import * as text from "../../../../kit/text.js";
import { ChallengePreference } from "./challenge-preference.js";

/** A rule a challenge preference must pass. Check returns its problems, or none. */
export interface ChallengePreferenceRule {
  check(item: ChallengePreference): string[];
}

export class ChallengePreferenceCeilingRangeRule implements ChallengePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengePreference): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengePreferenceLocaleLengthRule implements ChallengePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengePreference): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengePreferenceRequiredLocaleRule implements ChallengePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengePreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengePreferenceAllowedNameRule implements ChallengePreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengePreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class ChallengePreferenceNameLengthRule implements ChallengePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengePreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge preference. */
export class ChallengePreferenceValidator {
  rules: ChallengePreferenceRule[];

  constructor(rules: ChallengePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengePreference[]): Map<string, string[]> {
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

export function defaultChallengePreferenceValidator(): ChallengePreferenceValidator {
  return new ChallengePreferenceValidator(
    [
      new ChallengePreferenceCeilingRangeRule(7, 2422.3),
      new ChallengePreferenceLocaleLengthRule(3600),
      new ChallengePreferenceRequiredLocaleRule("challenge preference needs a value"),
      new ChallengePreferenceAllowedNameRule(["fallback", "regional", "capped"]),
      new ChallengePreferenceNameLengthRule(255),
    ],
  );
}
