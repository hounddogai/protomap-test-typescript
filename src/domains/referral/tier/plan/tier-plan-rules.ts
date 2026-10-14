import { TierPlan } from "./tier-plan.js";

/** A rule a tier plan must pass. Check returns its problems, or none. */
export interface TierPlanRule {
  check(item: TierPlan): string[];
}

export class TierPlanLabelLengthRule implements TierPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierPlanClicksRangeRule implements TierPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierPlan): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierPlanRequiredCodeRule implements TierPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier plan. */
export class TierPlanValidator {
  rules: TierPlanRule[];

  constructor(rules: TierPlanRule[]) {
    this.rules = rules;
  }

  validate(item: TierPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierPlan[]): Map<string, string[]> {
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

export function defaultTierPlanValidator(): TierPlanValidator {
  return new TierPlanValidator(
    [
      new TierPlanLabelLengthRule(1000),
      new TierPlanClicksRangeRule(16, 255),
      new TierPlanRequiredCodeRule("tier plan needs this field"),
    ],
  );
}
