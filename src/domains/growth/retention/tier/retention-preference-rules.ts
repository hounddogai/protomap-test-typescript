import { RetentionPreference } from "./retention-preference.js";

/** A rule a retention preference must pass. Check returns its problems, or none. */
export interface RetentionPreferenceRule {
  check(item: RetentionPreference): string[];
}

export class RetentionPreferenceCodeLengthRule implements RetentionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionPreferenceRegionLengthRule implements RetentionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionPreference): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionPreferenceRequiredRegionRule implements RetentionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionPreference): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a retention preference. */
export class RetentionPreferenceValidator {
  rules: RetentionPreferenceRule[];

  constructor(rules: RetentionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionPreference[]): Map<string, string[]> {
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

export function defaultRetentionPreferenceValidator(): RetentionPreferenceValidator {
  return new RetentionPreferenceValidator(
    [
      new RetentionPreferenceCodeLengthRule(1000),
      new RetentionPreferenceRegionLengthRule(32),
      new RetentionPreferenceRequiredRegionRule("retention preference needs an entry"),
    ],
  );
}
