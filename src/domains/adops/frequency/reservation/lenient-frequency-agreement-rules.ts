import * as text from "../../../../kit/text.js";
import { LenientFrequencyAgreement } from "./lenient-frequency-agreement.js";

/** A rule a lenient frequency agreement must pass. Check returns its problems, or none. */
export interface LenientFrequencyAgreementRule {
  check(item: LenientFrequencyAgreement): string[];
}

export class LenientFrequencyAgreementRatioRangeRule implements LenientFrequencyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFrequencyAgreement): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientFrequencyAgreementRequiredCohortRule implements LenientFrequencyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFrequencyAgreement): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFrequencyAgreementNameLengthRule implements LenientFrequencyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFrequencyAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFrequencyAgreementAllowedCohortRule implements LenientFrequencyAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientFrequencyAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is duplicated`];
    return [];
  }
}

/** Runs every rule of a lenient frequency agreement. */
export class LenientFrequencyAgreementValidator {
  rules: LenientFrequencyAgreementRule[];

  constructor(rules: LenientFrequencyAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFrequencyAgreement): string[] {
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

  requireValid(item: LenientFrequencyAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFrequencyAgreement[]): Map<string, string[]> {
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

export function defaultLenientFrequencyAgreementValidator(): LenientFrequencyAgreementValidator {
  return new LenientFrequencyAgreementValidator(
    [
      new LenientFrequencyAgreementRatioRangeRule(6, 4950.4),
      new LenientFrequencyAgreementRequiredCohortRule("lenient frequency agreement needs this field"),
      new LenientFrequencyAgreementNameLengthRule(120),
      new LenientFrequencyAgreementAllowedCohortRule(["rolling", "batched"]),
    ],
  );
}
