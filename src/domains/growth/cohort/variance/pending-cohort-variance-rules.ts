import { PendingCohortVariance } from "./pending-cohort-variance.js";

/** A rule a pending cohort variance must pass. Check returns its problems, or none. */
export interface PendingCohortVarianceRule {
  check(item: PendingCohortVariance): string[];
}

export class PendingCohortVarianceLabelLengthRule implements PendingCohortVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCohortVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCohortVarianceRequiredExternalRefRule implements PendingCohortVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCohortVariance): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCohortVarianceRequiredSourceRule implements PendingCohortVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCohortVariance): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending cohort variance. */
export class PendingCohortVarianceValidator {
  rules: PendingCohortVarianceRule[];

  constructor(rules: PendingCohortVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCohortVariance): string[] {
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

  requireValid(item: PendingCohortVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCohortVariance[]): Map<string, string[]> {
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

export function defaultPendingCohortVarianceValidator(): PendingCohortVarianceValidator {
  return new PendingCohortVarianceValidator(
    [
      new PendingCohortVarianceLabelLengthRule(1000),
      new PendingCohortVarianceRequiredExternalRefRule("pending cohort variance needs a value"),
      new PendingCohortVarianceRequiredSourceRule("pending cohort variance needs an entry"),
    ],
  );
}
