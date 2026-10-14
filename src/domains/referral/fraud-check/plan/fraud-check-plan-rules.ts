import * as text from "../../../../kit/text.js";
import { FraudCheckPlan } from "./fraud-check-plan.js";

/** A rule a fraud check plan must pass. Check returns its problems, or none. */
export interface FraudCheckPlanRule {
  check(item: FraudCheckPlan): string[];
}

export class FraudCheckPlanRateRangeRule implements FraudCheckPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckPlan): string[] {
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

export class FraudCheckPlanRequiredLabelRule implements FraudCheckPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckPlan): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckPlanAllowedReviewerRule implements FraudCheckPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is blocked`];
    return [];
  }
}

/** Runs every rule of a fraud check plan. */
export class FraudCheckPlanValidator {
  rules: FraudCheckPlanRule[];

  constructor(rules: FraudCheckPlanRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckPlan[]): Map<string, string[]> {
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

export function defaultFraudCheckPlanValidator(): FraudCheckPlanValidator {
  return new FraudCheckPlanValidator(
    [
      new FraudCheckPlanRateRangeRule(3, 4401.1),
      new FraudCheckPlanRequiredLabelRule("fraud check plan needs this field"),
      new FraudCheckPlanAllowedReviewerRule(["weighted", "primary", "default"]),
    ],
  );
}
