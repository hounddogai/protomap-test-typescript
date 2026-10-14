import * as text from "../../../../kit/text.js";
import { CappedSuppressionPlan } from "./capped-suppression-plan.js";

/** A rule a capped suppression plan must pass. Check returns its problems, or none. */
export interface CappedSuppressionPlanRule {
  check(item: CappedSuppressionPlan): string[];
}

export class CappedSuppressionPlanAllowedReviewerRule implements CappedSuppressionPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedSuppressionPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is stale`];
    return [];
  }
}

export class CappedSuppressionPlanLabelLengthRule implements CappedSuppressionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSuppressionPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSuppressionPlanUnitLengthRule implements CappedSuppressionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSuppressionPlan): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSuppressionPlanThresholdRangeRule implements CappedSuppressionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedSuppressionPlan): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedSuppressionPlanRequiredUnitRule implements CappedSuppressionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSuppressionPlan): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped suppression plan. */
export class CappedSuppressionPlanValidator {
  rules: CappedSuppressionPlanRule[];

  constructor(rules: CappedSuppressionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSuppressionPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedSuppressionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSuppressionPlan[]): Map<string, string[]> {
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

export function defaultCappedSuppressionPlanValidator(): CappedSuppressionPlanValidator {
  return new CappedSuppressionPlanValidator(
    [
      new CappedSuppressionPlanAllowedReviewerRule(["weighted"]),
      new CappedSuppressionPlanLabelLengthRule(32),
      new CappedSuppressionPlanUnitLengthRule(255),
      new CappedSuppressionPlanThresholdRangeRule(7.3, 1369.6),
      new CappedSuppressionPlanRequiredUnitRule("capped suppression plan needs an entry"),
    ],
  );
}
