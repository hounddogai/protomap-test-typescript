import { LenientStreakAgreement } from "./lenient-streak-agreement.js";

/** A rule a lenient streak agreement must pass. Check returns its problems, or none. */
export interface LenientStreakAgreementRule {
  check(item: LenientStreakAgreement): string[];
}

export class LenientStreakAgreementLabelLengthRule implements LenientStreakAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStreakAgreementRequiredLabelRule implements LenientStreakAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakAgreementExpiresAtRangeRule implements LenientStreakAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientStreakAgreement): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientStreakAgreementRequiredNameRule implements LenientStreakAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakAgreementUtmSourceLengthRule implements LenientStreakAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakAgreement): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient streak agreement. */
export class LenientStreakAgreementValidator {
  rules: LenientStreakAgreementRule[];

  constructor(rules: LenientStreakAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: LenientStreakAgreement): string[] {
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

  requireValid(item: LenientStreakAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientStreakAgreement[]): Map<string, string[]> {
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

export function defaultLenientStreakAgreementValidator(): LenientStreakAgreementValidator {
  return new LenientStreakAgreementValidator(
    [
      new LenientStreakAgreementLabelLengthRule(86400),
      new LenientStreakAgreementRequiredLabelRule("lenient streak agreement needs this field"),
      new LenientStreakAgreementExpiresAtRangeRule(120, 120),
      new LenientStreakAgreementRequiredNameRule("lenient streak agreement needs this field"),
      new LenientStreakAgreementUtmSourceLengthRule(86400),
    ],
  );
}
