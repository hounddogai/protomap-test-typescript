import { CappedEnrollmentDraft } from "./capped-enrollment-draft.js";

/** A rule a capped enrollment draft must pass. Check returns its problems, or none. */
export interface CappedEnrollmentDraftRule {
  check(item: CappedEnrollmentDraft): string[];
}

export class CappedEnrollmentDraftRequiredCodeRule implements CappedEnrollmentDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedEnrollmentDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedEnrollmentDraftOpenRateRangeRule implements CappedEnrollmentDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedEnrollmentDraft): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedEnrollmentDraftCodePrefixRule implements CappedEnrollmentDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedEnrollmentDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedEnrollmentDraftCountryLengthRule implements CappedEnrollmentDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentDraft): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped enrollment draft. */
export class CappedEnrollmentDraftValidator {
  rules: CappedEnrollmentDraftRule[];

  constructor(rules: CappedEnrollmentDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CappedEnrollmentDraft): string[] {
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

  requireValid(item: CappedEnrollmentDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedEnrollmentDraft[]): Map<string, string[]> {
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

export function defaultCappedEnrollmentDraftValidator(): CappedEnrollmentDraftValidator {
  return new CappedEnrollmentDraftValidator(
    [
      new CappedEnrollmentDraftRequiredCodeRule("capped enrollment draft needs an entry"),
      new CappedEnrollmentDraftOpenRateRangeRule(0.7, 1821.9),
      new CappedEnrollmentDraftCodePrefixRule("ACM"),
      new CappedEnrollmentDraftCountryLengthRule(120),
    ],
  );
}
