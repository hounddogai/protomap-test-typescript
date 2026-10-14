import { RollingCohortPlan } from "./rolling-cohort-plan.js";

/** A rule a rolling cohort plan must pass. Check returns its problems, or none. */
export interface RollingCohortPlanRule {
  check(item: RollingCohortPlan): string[];
}

export class RollingCohortPlanFrequencyCapRangeRule implements RollingCohortPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCohortPlan): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingCohortPlanSequenceRangeRule implements RollingCohortPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCohortPlan): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingCohortPlanCodeLengthRule implements RollingCohortPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCohortPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCohortPlanBidRangeRule implements RollingCohortPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCohortPlan): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingCohortPlanLabelLengthRule implements RollingCohortPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCohortPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling cohort plan. */
export class RollingCohortPlanValidator {
  rules: RollingCohortPlanRule[];

  constructor(rules: RollingCohortPlanRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCohortPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingCohortPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCohortPlan[]): Map<string, string[]> {
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

export function defaultRollingCohortPlanValidator(): RollingCohortPlanValidator {
  return new RollingCohortPlanValidator(
    [
      new RollingCohortPlanFrequencyCapRangeRule(120, 120),
      new RollingCohortPlanSequenceRangeRule(120, 255),
      new RollingCohortPlanCodeLengthRule(64),
      new RollingCohortPlanBidRangeRule(1.4, 2171.3),
      new RollingCohortPlanLabelLengthRule(80),
    ],
  );
}
