import { WeightedDomainDigest } from "./weighted-domain-digest.js";

/** A rule a weighted domain digest must pass. Check returns its problems, or none. */
export interface WeightedDomainDigestRule {
  check(item: WeightedDomainDigest): string[];
}

export class WeightedDomainDigestTitleLengthRule implements WeightedDomainDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDomainDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDomainDigestRequiredCurrencyRule implements WeightedDomainDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDomainDigest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDomainDigestGraceDaysRangeRule implements WeightedDomainDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedDomainDigest): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedDomainDigestArchivedGuardRule implements WeightedDomainDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedDomainDigest): string[] {
    if (item.archived && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class WeightedDomainDigestVersionRangeRule implements WeightedDomainDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedDomainDigest): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedDomainDigestFloorValueRangeRule implements WeightedDomainDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedDomainDigest): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted domain digest. */
export class WeightedDomainDigestValidator {
  rules: WeightedDomainDigestRule[];

  constructor(rules: WeightedDomainDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedDomainDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedDomainDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedDomainDigest[]): Map<string, string[]> {
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

export function defaultWeightedDomainDigestValidator(): WeightedDomainDigestValidator {
  return new WeightedDomainDigestValidator(
    [
      new WeightedDomainDigestTitleLengthRule(86400),
      new WeightedDomainDigestRequiredCurrencyRule("weighted domain digest needs a value"),
      new WeightedDomainDigestGraceDaysRangeRule(32, 120),
      new WeightedDomainDigestArchivedGuardRule(3600),
      new WeightedDomainDigestVersionRangeRule(80, 120),
      new WeightedDomainDigestFloorValueRangeRule(7.4, 1425.7),
    ],
  );
}
