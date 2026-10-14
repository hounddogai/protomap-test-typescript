import { PacingPlan } from "./pacing-plan.js";

/** A rule a pacing plan must pass. Check returns its problems, or none. */
export interface PacingPlanRule {
  check(item: PacingPlan): string[];
}

export class PacingPlanLabelLengthRule implements PacingPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingPlanRequiredCodeRule implements PacingPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingPlanGraceDaysRangeRule implements PacingPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingPlan): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingPlanDiscountRangeRule implements PacingPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingPlan): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pacing plan. */
export class PacingPlanValidator {
  rules: PacingPlanRule[];

  constructor(rules: PacingPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PacingPlan): string[] {
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

  requireValid(item: PacingPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingPlan[]): Map<string, string[]> {
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

export function defaultPacingPlanValidator(): PacingPlanValidator {
  return new PacingPlanValidator(
    [
      new PacingPlanLabelLengthRule(32),
      new PacingPlanRequiredCodeRule("pacing plan needs an entry"),
      new PacingPlanGraceDaysRangeRule(32, 80),
      new PacingPlanDiscountRangeRule(6.7, 1148.4),
    ],
  );
}
