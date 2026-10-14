import { PrimaryStreakPlan } from "./primary-streak-plan.js";

/** A rule a primary streak plan must pass. Check returns its problems, or none. */
export interface PrimaryStreakPlanRule {
  check(item: PrimaryStreakPlan): string[];
}

export class PrimaryStreakPlanRequiredExternalRefRule implements PrimaryStreakPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryStreakPlan): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryStreakPlanRequiredTitleRule implements PrimaryStreakPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryStreakPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryStreakPlanConversionRateRangeRule implements PrimaryStreakPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStreakPlan): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary streak plan. */
export class PrimaryStreakPlanValidator {
  rules: PrimaryStreakPlanRule[];

  constructor(rules: PrimaryStreakPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryStreakPlan): string[] {
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

  requireValid(item: PrimaryStreakPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryStreakPlan[]): Map<string, string[]> {
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

export function defaultPrimaryStreakPlanValidator(): PrimaryStreakPlanValidator {
  return new PrimaryStreakPlanValidator(
    [
      new PrimaryStreakPlanRequiredExternalRefRule("primary streak plan needs an entry"),
      new PrimaryStreakPlanRequiredTitleRule("primary streak plan needs this field"),
      new PrimaryStreakPlanConversionRateRangeRule(6.2, 1315.2),
    ],
  );
}
