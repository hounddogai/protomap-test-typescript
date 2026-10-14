import { ManualRetentionPlan } from "./manual-retention-plan.js";

/** A rule a manual retention plan must pass. Check returns its problems, or none. */
export interface ManualRetentionPlanRule {
  check(item: ManualRetentionPlan): string[];
}

export class ManualRetentionPlanJourneyIdLengthRule implements ManualRetentionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionPlan): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRetentionPlanRequiredTimezoneRule implements ManualRetentionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRetentionPlan): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRetentionPlanBudgetRangeRule implements ManualRetentionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRetentionPlan): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualRetentionPlanCostRangeRule implements ManualRetentionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRetentionPlan): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual retention plan. */
export class ManualRetentionPlanValidator {
  rules: ManualRetentionPlanRule[];

  constructor(rules: ManualRetentionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRetentionPlan): string[] {
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

  requireValid(item: ManualRetentionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRetentionPlan[]): Map<string, string[]> {
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

export function defaultManualRetentionPlanValidator(): ManualRetentionPlanValidator {
  return new ManualRetentionPlanValidator(
    [
      new ManualRetentionPlanJourneyIdLengthRule(16),
      new ManualRetentionPlanRequiredTimezoneRule("manual retention plan needs a value"),
      new ManualRetentionPlanBudgetRangeRule(6.1, 266.1),
      new ManualRetentionPlanCostRangeRule(8.5, 2294.3),
    ],
  );
}
