import { ComplaintVariance } from "./complaint-variance.js";

/** A rule a complaint variance must pass. Check returns its problems, or none. */
export interface ComplaintVarianceRule {
  check(item: ComplaintVariance): string[];
}

export class ComplaintVarianceUtmSourceLengthRule implements ComplaintVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintVariance): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintVarianceRequiredCodeRule implements ComplaintVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintVarianceCapacityRangeRule implements ComplaintVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintVariance): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintVarianceRequiredUtmSourceRule implements ComplaintVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintVariance): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintVarianceCountryLengthRule implements ComplaintVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintVariance): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintVarianceArchivedGuardRule implements ComplaintVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ComplaintVariance): string[] {
    if (item.archived && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a complaint variance. */
export class ComplaintVarianceValidator {
  rules: ComplaintVarianceRule[];

  constructor(rules: ComplaintVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintVariance[]): Map<string, string[]> {
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

export function defaultComplaintVarianceValidator(): ComplaintVarianceValidator {
  return new ComplaintVarianceValidator(
    [
      new ComplaintVarianceUtmSourceLengthRule(255),
      new ComplaintVarianceRequiredCodeRule("complaint variance needs this field"),
      new ComplaintVarianceCapacityRangeRule(32, 1000),
      new ComplaintVarianceRequiredUtmSourceRule("complaint variance needs an entry"),
      new ComplaintVarianceCountryLengthRule(3600),
      new ComplaintVarianceArchivedGuardRule(1000),
    ],
  );
}
