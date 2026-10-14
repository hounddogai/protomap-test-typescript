import { LegacyComplaintPreference } from "./legacy-complaint-preference.js";

/** A rule a legacy complaint preference must pass. Check returns its problems, or none. */
export interface LegacyComplaintPreferenceRule {
  check(item: LegacyComplaintPreference): string[];
}

export class LegacyComplaintPreferenceRequiredCodeRule implements LegacyComplaintPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyComplaintPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyComplaintPreferenceRequiredOwnerIdRule implements LegacyComplaintPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyComplaintPreference): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyComplaintPreferenceRequiredTitleRule implements LegacyComplaintPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyComplaintPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyComplaintPreferenceOwnerIdLengthRule implements LegacyComplaintPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyComplaintPreference): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy complaint preference. */
export class LegacyComplaintPreferenceValidator {
  rules: LegacyComplaintPreferenceRule[];

  constructor(rules: LegacyComplaintPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyComplaintPreference): string[] {
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

  requireValid(item: LegacyComplaintPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyComplaintPreference[]): Map<string, string[]> {
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

export function defaultLegacyComplaintPreferenceValidator(): LegacyComplaintPreferenceValidator {
  return new LegacyComplaintPreferenceValidator(
    [
      new LegacyComplaintPreferenceRequiredCodeRule("legacy complaint preference needs a value"),
      new LegacyComplaintPreferenceRequiredOwnerIdRule("legacy complaint preference needs an entry"),
      new LegacyComplaintPreferenceRequiredTitleRule("legacy complaint preference needs an entry"),
      new LegacyComplaintPreferenceOwnerIdLengthRule(1000),
    ],
  );
}
