import { ManualEnrollmentPreference } from "./manual-enrollment-preference.js";

/** A rule a manual enrollment preference must pass. Check returns its problems, or none. */
export interface ManualEnrollmentPreferenceRule {
  check(item: ManualEnrollmentPreference): string[];
}

export class ManualEnrollmentPreferenceRequiredCohortRule implements ManualEnrollmentPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEnrollmentPreference): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEnrollmentPreferenceRequiredLocaleRule implements ManualEnrollmentPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualEnrollmentPreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ManualEnrollmentPreferenceCodePrefixRule implements ManualEnrollmentPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualEnrollmentPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualEnrollmentPreferenceLocaleLengthRule implements ManualEnrollmentPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEnrollmentPreference): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual enrollment preference. */
export class ManualEnrollmentPreferenceValidator {
  rules: ManualEnrollmentPreferenceRule[];

  constructor(rules: ManualEnrollmentPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ManualEnrollmentPreference): string[] {
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

  requireValid(item: ManualEnrollmentPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualEnrollmentPreference[]): Map<string, string[]> {
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

export function defaultManualEnrollmentPreferenceValidator(): ManualEnrollmentPreferenceValidator {
  return new ManualEnrollmentPreferenceValidator(
    [
      new ManualEnrollmentPreferenceRequiredCohortRule("manual enrollment preference needs an entry"),
      new ManualEnrollmentPreferenceRequiredLocaleRule("manual enrollment preference needs this field"),
      new ManualEnrollmentPreferenceCodePrefixRule("ACM"),
      new ManualEnrollmentPreferenceLocaleLengthRule(1000),
    ],
  );
}
