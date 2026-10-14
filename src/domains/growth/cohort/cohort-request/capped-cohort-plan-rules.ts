import { CappedCohortPlan } from "./capped-cohort-plan.js";

/** A rule a capped cohort plan must pass. Check returns its problems, or none. */
export interface CappedCohortPlanRule {
  check(item: CappedCohortPlan): string[];
}

export class CappedCohortPlanRequiredNameRule implements CappedCohortPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCohortPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCohortPlanCampaignRefLengthRule implements CappedCohortPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCohortPlan): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCohortPlanDurationMinutesRangeRule implements CappedCohortPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCohortPlan): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedCohortPlanRequiredCampaignRefRule implements CappedCohortPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCohortPlan): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCohortPlanRateRangeRule implements CappedCohortPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCohortPlan): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped cohort plan. */
export class CappedCohortPlanValidator {
  rules: CappedCohortPlanRule[];

  constructor(rules: CappedCohortPlanRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCohortPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedCohortPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCohortPlan[]): Map<string, string[]> {
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

export function defaultCappedCohortPlanValidator(): CappedCohortPlanValidator {
  return new CappedCohortPlanValidator(
    [
      new CappedCohortPlanRequiredNameRule("capped cohort plan needs this field"),
      new CappedCohortPlanCampaignRefLengthRule(16),
      new CappedCohortPlanDurationMinutesRangeRule(16, 1000),
      new CappedCohortPlanRequiredCampaignRefRule("capped cohort plan needs this field"),
      new CappedCohortPlanRateRangeRule(5.8, 910),
    ],
  );
}
