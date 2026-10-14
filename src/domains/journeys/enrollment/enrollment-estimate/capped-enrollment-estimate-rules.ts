import { CappedEnrollmentEstimate } from "./capped-enrollment-estimate.js";

/** A rule a capped enrollment estimate must pass. Check returns its problems, or none. */
export interface CappedEnrollmentEstimateRule {
  check(item: CappedEnrollmentEstimate): string[];
}

export class CappedEnrollmentEstimateRequiredTitleRule implements CappedEnrollmentEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedEnrollmentEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedEnrollmentEstimateExternalRefLengthRule implements CappedEnrollmentEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentEstimate): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedEnrollmentEstimateReviewerLengthRule implements CappedEnrollmentEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentEstimate): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedEnrollmentEstimateTitleLengthRule implements CappedEnrollmentEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedEnrollmentEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped enrollment estimate. */
export class CappedEnrollmentEstimateValidator {
  rules: CappedEnrollmentEstimateRule[];

  constructor(rules: CappedEnrollmentEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: CappedEnrollmentEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedEnrollmentEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedEnrollmentEstimate[]): Map<string, string[]> {
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

export function defaultCappedEnrollmentEstimateValidator(): CappedEnrollmentEstimateValidator {
  return new CappedEnrollmentEstimateValidator(
    [
      new CappedEnrollmentEstimateRequiredTitleRule("capped enrollment estimate needs this field"),
      new CappedEnrollmentEstimateExternalRefLengthRule(16),
      new CappedEnrollmentEstimateReviewerLengthRule(64),
      new CappedEnrollmentEstimateTitleLengthRule(64),
    ],
  );
}
