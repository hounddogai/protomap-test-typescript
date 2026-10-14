import { RegionalCohortClaim } from "./regional-cohort-claim.js";

/** A rule a regional cohort claim must pass. Check returns its problems, or none. */
export interface RegionalCohortClaimRule {
  check(item: RegionalCohortClaim): string[];
}

export class RegionalCohortClaimOpenRateRangeRule implements RegionalCohortClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCohortClaim): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalCohortClaimRequiredPhoneRule implements RegionalCohortClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCohortClaim): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCohortClaimTitleLengthRule implements RegionalCohortClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCohortClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional cohort claim. */
export class RegionalCohortClaimValidator {
  rules: RegionalCohortClaimRule[];

  constructor(rules: RegionalCohortClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCohortClaim): string[] {
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

  requireValid(item: RegionalCohortClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCohortClaim[]): Map<string, string[]> {
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

export function defaultRegionalCohortClaimValidator(): RegionalCohortClaimValidator {
  return new RegionalCohortClaimValidator(
    [
      new RegionalCohortClaimOpenRateRangeRule(2.7, 1945.6),
      new RegionalCohortClaimRequiredPhoneRule("regional cohort claim needs this field"),
      new RegionalCohortClaimTitleLengthRule(64),
    ],
  );
}
