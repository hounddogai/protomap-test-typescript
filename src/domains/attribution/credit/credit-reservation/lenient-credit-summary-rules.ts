import { LenientCreditSummary } from "./lenient-credit-summary.js";

/** A rule a lenient credit summary must pass. Check returns its problems, or none. */
export interface LenientCreditSummaryRule {
  check(item: LenientCreditSummary): string[];
}

export class LenientCreditSummaryRevisionRangeRule implements LenientCreditSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCreditSummary): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientCreditSummaryRequiredCodeRule implements LenientCreditSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCreditSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCreditSummaryRegionLengthRule implements LenientCreditSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCreditSummary): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCreditSummaryEndsAtRangeRule implements LenientCreditSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCreditSummary): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient credit summary. */
export class LenientCreditSummaryValidator {
  rules: LenientCreditSummaryRule[];

  constructor(rules: LenientCreditSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCreditSummary): string[] {
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

  requireValid(item: LenientCreditSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCreditSummary[]): Map<string, string[]> {
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

export function defaultLenientCreditSummaryValidator(): LenientCreditSummaryValidator {
  return new LenientCreditSummaryValidator(
    [
      new LenientCreditSummaryRevisionRangeRule(32, 3600),
      new LenientCreditSummaryRequiredCodeRule("lenient credit summary needs an entry"),
      new LenientCreditSummaryRegionLengthRule(3600),
      new LenientCreditSummaryEndsAtRangeRule(64, 86400),
    ],
  );
}
