import { StrictWindowPreference } from "./strict-window-preference.js";

/** A rule a strict window preference must pass. Check returns its problems, or none. */
export interface StrictWindowPreferenceRule {
  check(item: StrictWindowPreference): string[];
}

export class StrictWindowPreferenceArchivedGuardRule implements StrictWindowPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictWindowPreference): string[] {
    if (item.archived && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class StrictWindowPreferenceCodeLengthRule implements StrictWindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWindowPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWindowPreferenceAudienceIdLengthRule implements StrictWindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWindowPreference): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWindowPreferenceRequiredAudienceIdRule implements StrictWindowPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWindowPreference): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWindowPreferenceTitleLengthRule implements StrictWindowPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWindowPreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWindowPreferenceRequiredTitleRule implements StrictWindowPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWindowPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict window preference. */
export class StrictWindowPreferenceValidator {
  rules: StrictWindowPreferenceRule[];

  constructor(rules: StrictWindowPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: StrictWindowPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictWindowPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictWindowPreference[]): Map<string, string[]> {
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

export function defaultStrictWindowPreferenceValidator(): StrictWindowPreferenceValidator {
  return new StrictWindowPreferenceValidator(
    [
      new StrictWindowPreferenceArchivedGuardRule(6.3),
      new StrictWindowPreferenceCodeLengthRule(80),
      new StrictWindowPreferenceAudienceIdLengthRule(86400),
      new StrictWindowPreferenceRequiredAudienceIdRule("strict window preference needs an entry"),
      new StrictWindowPreferenceTitleLengthRule(16),
      new StrictWindowPreferenceRequiredTitleRule("strict window preference needs an entry"),
    ],
  );
}
