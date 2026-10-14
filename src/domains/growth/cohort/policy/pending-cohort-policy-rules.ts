import { PendingCohortPolicy } from "./pending-cohort-policy.js";

/** A rule a pending cohort policy must pass. Check returns its problems, or none. */
export interface PendingCohortPolicyRule {
  check(item: PendingCohortPolicy): string[];
}

export class PendingCohortPolicyCountryLengthRule implements PendingCohortPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCohortPolicy): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCohortPolicyWeightRangeRule implements PendingCohortPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCohortPolicy): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingCohortPolicyMinimumRangeRule implements PendingCohortPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCohortPolicy): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending cohort policy. */
export class PendingCohortPolicyValidator {
  rules: PendingCohortPolicyRule[];

  constructor(rules: PendingCohortPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCohortPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingCohortPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCohortPolicy[]): Map<string, string[]> {
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

export function defaultPendingCohortPolicyValidator(): PendingCohortPolicyValidator {
  return new PendingCohortPolicyValidator(
    [
      new PendingCohortPolicyCountryLengthRule(3600),
      new PendingCohortPolicyWeightRangeRule(3.3, 793.3),
      new PendingCohortPolicyMinimumRangeRule(1.8, 2675.8),
    ],
  );
}
