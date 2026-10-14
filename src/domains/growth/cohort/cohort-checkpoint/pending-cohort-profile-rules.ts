import { PendingCohortProfile } from "./pending-cohort-profile.js";

/** A rule a pending cohort profile must pass. Check returns its problems, or none. */
export interface PendingCohortProfileRule {
  check(item: PendingCohortProfile): string[];
}

export class PendingCohortProfileApprovedGuardRule implements PendingCohortProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingCohortProfile): string[] {
    if (item.approved && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PendingCohortProfileRetriesRangeRule implements PendingCohortProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCohortProfile): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingCohortProfileExternalRefLengthRule implements PendingCohortProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCohortProfile): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCohortProfileRequiredUnitRule implements PendingCohortProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCohortProfile): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending cohort profile. */
export class PendingCohortProfileValidator {
  rules: PendingCohortProfileRule[];

  constructor(rules: PendingCohortProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCohortProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingCohortProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCohortProfile[]): Map<string, string[]> {
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

export function defaultPendingCohortProfileValidator(): PendingCohortProfileValidator {
  return new PendingCohortProfileValidator(
    [
      new PendingCohortProfileApprovedGuardRule(16),
      new PendingCohortProfileRetriesRangeRule(64, 86400),
      new PendingCohortProfileExternalRefLengthRule(80),
      new PendingCohortProfileRequiredUnitRule("pending cohort profile needs this field"),
    ],
  );
}
