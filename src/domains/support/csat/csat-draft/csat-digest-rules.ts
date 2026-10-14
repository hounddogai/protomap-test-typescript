import { CsatDigest } from "./csat-digest.js";

/** A rule a csat digest must pass. Check returns its problems, or none. */
export interface CsatDigestRule {
  check(item: CsatDigest): string[];
}

export class CsatDigestGraceDaysRangeRule implements CsatDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatDigest): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatDigestLocaleLengthRule implements CsatDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatDigest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatDigestRequiredCodeRule implements CsatDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat digest. */
export class CsatDigestValidator {
  rules: CsatDigestRule[];

  constructor(rules: CsatDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CsatDigest): string[] {
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

  requireValid(item: CsatDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatDigest[]): Map<string, string[]> {
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

export function defaultCsatDigestValidator(): CsatDigestValidator {
  return new CsatDigestValidator(
    [
      new CsatDigestGraceDaysRangeRule(16, 32),
      new CsatDigestLocaleLengthRule(1000),
      new CsatDigestRequiredCodeRule("csat digest needs a value"),
    ],
  );
}
