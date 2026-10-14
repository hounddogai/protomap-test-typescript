import { AdaptiveEnrollmentPlan } from "./adaptive-enrollment-plan.js";

/** A rule a adaptive enrollment plan must pass. Check returns its problems, or none. */
export interface AdaptiveEnrollmentPlanRule {
  check(item: AdaptiveEnrollmentPlan): string[];
}

export class AdaptiveEnrollmentPlanNameLengthRule implements AdaptiveEnrollmentPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEnrollmentPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveEnrollmentPlanJourneyIdLengthRule implements AdaptiveEnrollmentPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEnrollmentPlan): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveEnrollmentPlanCountryLengthRule implements AdaptiveEnrollmentPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEnrollmentPlan): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive enrollment plan. */
export class AdaptiveEnrollmentPlanValidator {
  rules: AdaptiveEnrollmentPlanRule[];

  constructor(rules: AdaptiveEnrollmentPlanRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveEnrollmentPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveEnrollmentPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveEnrollmentPlan[]): Map<string, string[]> {
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

export function defaultAdaptiveEnrollmentPlanValidator(): AdaptiveEnrollmentPlanValidator {
  return new AdaptiveEnrollmentPlanValidator(
    [
      new AdaptiveEnrollmentPlanNameLengthRule(120),
      new AdaptiveEnrollmentPlanJourneyIdLengthRule(86400),
      new AdaptiveEnrollmentPlanCountryLengthRule(32),
    ],
  );
}
