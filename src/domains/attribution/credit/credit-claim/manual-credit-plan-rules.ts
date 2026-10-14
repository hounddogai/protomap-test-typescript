import * as text from "../../../../kit/text.js";
import { ManualCreditPlan } from "./manual-credit-plan.js";

/** A rule a manual credit plan must pass. Check returns its problems, or none. */
export interface ManualCreditPlanRule {
  check(item: ManualCreditPlan): string[];
}

export class ManualCreditPlanWeightRangeRule implements ManualCreditPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualCreditPlan): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualCreditPlanAllowedLabelRule implements ManualCreditPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualCreditPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class ManualCreditPlanDescriptionLengthRule implements ManualCreditPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualCreditPlan): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual credit plan. */
export class ManualCreditPlanValidator {
  rules: ManualCreditPlanRule[];

  constructor(rules: ManualCreditPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ManualCreditPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualCreditPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualCreditPlan[]): Map<string, string[]> {
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

export function defaultManualCreditPlanValidator(): ManualCreditPlanValidator {
  return new ManualCreditPlanValidator(
    [
      new ManualCreditPlanWeightRangeRule(8.7, 4431.8),
      new ManualCreditPlanAllowedLabelRule(["weighted"]),
      new ManualCreditPlanDescriptionLengthRule(64),
    ],
  );
}
