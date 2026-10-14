import { StreakPlan } from "./streak-plan.js";

/** A rule a streak plan must pass. Check returns its problems, or none. */
export interface StreakPlanRule {
  check(item: StreakPlan): string[];
}

export class StreakPlanRequiredDescriptionRule implements StreakPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakPlan): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class StreakPlanDescriptionLengthRule implements StreakPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakPlan): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakPlanThresholdRangeRule implements StreakPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakPlan): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakPlanTitleLengthRule implements StreakPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak plan. */
export class StreakPlanValidator {
  rules: StreakPlanRule[];

  constructor(rules: StreakPlanRule[]) {
    this.rules = rules;
  }

  validate(item: StreakPlan): string[] {
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

  requireValid(item: StreakPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakPlan[]): Map<string, string[]> {
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

export function defaultStreakPlanValidator(): StreakPlanValidator {
  return new StreakPlanValidator(
    [
      new StreakPlanRequiredDescriptionRule("streak plan needs an entry"),
      new StreakPlanDescriptionLengthRule(1000),
      new StreakPlanThresholdRangeRule(5.1, 653.3),
      new StreakPlanTitleLengthRule(16),
    ],
  );
}
