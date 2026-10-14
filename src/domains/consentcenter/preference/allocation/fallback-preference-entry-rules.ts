import { FallbackPreferenceEntry } from "./fallback-preference-entry.js";

/** A rule a fallback preference entry must pass. Check returns its problems, or none. */
export interface FallbackPreferenceEntryRule {
  check(item: FallbackPreferenceEntry): string[];
}

export class FallbackPreferenceEntryCodeLengthRule implements FallbackPreferenceEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPreferenceEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPreferenceEntryTimezoneLengthRule implements FallbackPreferenceEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPreferenceEntry): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPreferenceEntryTitleLengthRule implements FallbackPreferenceEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPreferenceEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPreferenceEntryRequiredTimezoneRule implements FallbackPreferenceEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPreferenceEntry): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback preference entry. */
export class FallbackPreferenceEntryValidator {
  rules: FallbackPreferenceEntryRule[];

  constructor(rules: FallbackPreferenceEntryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPreferenceEntry): string[] {
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

  requireValid(item: FallbackPreferenceEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPreferenceEntry[]): Map<string, string[]> {
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

export function defaultFallbackPreferenceEntryValidator(): FallbackPreferenceEntryValidator {
  return new FallbackPreferenceEntryValidator(
    [
      new FallbackPreferenceEntryCodeLengthRule(1000),
      new FallbackPreferenceEntryTimezoneLengthRule(80),
      new FallbackPreferenceEntryTitleLengthRule(120),
      new FallbackPreferenceEntryRequiredTimezoneRule("fallback preference entry needs this field"),
    ],
  );
}
