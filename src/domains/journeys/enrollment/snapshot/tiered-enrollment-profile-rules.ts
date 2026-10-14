import { TieredEnrollmentProfile } from "./tiered-enrollment-profile.js";

/** A rule a tiered enrollment profile must pass. Check returns its problems, or none. */
export interface TieredEnrollmentProfileRule {
  check(item: TieredEnrollmentProfile): string[];
}

export class TieredEnrollmentProfileRequiredNotesRule implements TieredEnrollmentProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEnrollmentProfile): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEnrollmentProfileCodeLengthRule implements TieredEnrollmentProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEnrollmentProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredEnrollmentProfileRequiredCodeRule implements TieredEnrollmentProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEnrollmentProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEnrollmentProfileCodePrefixRule implements TieredEnrollmentProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredEnrollmentProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered enrollment profile. */
export class TieredEnrollmentProfileValidator {
  rules: TieredEnrollmentProfileRule[];

  constructor(rules: TieredEnrollmentProfileRule[]) {
    this.rules = rules;
  }

  validate(item: TieredEnrollmentProfile): string[] {
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

  requireValid(item: TieredEnrollmentProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredEnrollmentProfile[]): Map<string, string[]> {
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

export function defaultTieredEnrollmentProfileValidator(): TieredEnrollmentProfileValidator {
  return new TieredEnrollmentProfileValidator(
    [
      new TieredEnrollmentProfileRequiredNotesRule("tiered enrollment profile needs this field"),
      new TieredEnrollmentProfileCodeLengthRule(16),
      new TieredEnrollmentProfileRequiredCodeRule("tiered enrollment profile needs this field"),
      new TieredEnrollmentProfileCodePrefixRule("X"),
    ],
  );
}
