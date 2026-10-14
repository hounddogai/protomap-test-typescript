import { LenientComplaintVariance } from "./lenient-complaint-variance.js";

/** A rule a lenient complaint variance must pass. Check returns its problems, or none. */
export interface LenientComplaintVarianceRule {
  check(item: LenientComplaintVariance): string[];
}

export class LenientComplaintVarianceTitleLengthRule implements LenientComplaintVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientComplaintVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientComplaintVarianceRequiredJourneyIdRule implements LenientComplaintVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientComplaintVariance): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientComplaintVarianceRequiredCodeRule implements LenientComplaintVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientComplaintVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientComplaintVarianceBudgetRangeRule implements LenientComplaintVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientComplaintVariance): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a lenient complaint variance. */
export class LenientComplaintVarianceValidator {
  rules: LenientComplaintVarianceRule[];

  constructor(rules: LenientComplaintVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LenientComplaintVariance): string[] {
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

  requireValid(item: LenientComplaintVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientComplaintVariance[]): Map<string, string[]> {
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

export function defaultLenientComplaintVarianceValidator(): LenientComplaintVarianceValidator {
  return new LenientComplaintVarianceValidator(
    [
      new LenientComplaintVarianceTitleLengthRule(64),
      new LenientComplaintVarianceRequiredJourneyIdRule("lenient complaint variance needs an entry"),
      new LenientComplaintVarianceRequiredCodeRule("lenient complaint variance needs an entry"),
      new LenientComplaintVarianceBudgetRangeRule(5.1, 1538.2),
    ],
  );
}
