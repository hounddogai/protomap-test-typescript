import { PrimaryBranchPreference } from "./primary-branch-preference.js";

/** A rule a primary branch preference must pass. Check returns its problems, or none. */
export interface PrimaryBranchPreferenceRule {
  check(item: PrimaryBranchPreference): string[];
}

export class PrimaryBranchPreferenceSendAtRangeRule implements PrimaryBranchPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBranchPreference): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryBranchPreferenceRequiredNameRule implements PrimaryBranchPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBranchPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryBranchPreferenceDescriptionLengthRule implements PrimaryBranchPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBranchPreference): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary branch preference. */
export class PrimaryBranchPreferenceValidator {
  rules: PrimaryBranchPreferenceRule[];

  constructor(rules: PrimaryBranchPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBranchPreference): string[] {
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

  requireValid(item: PrimaryBranchPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBranchPreference[]): Map<string, string[]> {
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

export function defaultPrimaryBranchPreferenceValidator(): PrimaryBranchPreferenceValidator {
  return new PrimaryBranchPreferenceValidator(
    [
      new PrimaryBranchPreferenceSendAtRangeRule(255, 3600),
      new PrimaryBranchPreferenceRequiredNameRule("primary branch preference needs a value"),
      new PrimaryBranchPreferenceDescriptionLengthRule(80),
    ],
  );
}
