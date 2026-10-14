import { WeightedInsightPlan } from "./weighted-insight-plan.js";

/** A rule a weighted insight plan must pass. Check returns its problems, or none. */
export interface WeightedInsightPlanRule {
  check(item: WeightedInsightPlan): string[];
}

export class WeightedInsightPlanNameLengthRule implements WeightedInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInsightPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInsightPlanUtmSourceLengthRule implements WeightedInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInsightPlan): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInsightPlanAttemptsRangeRule implements WeightedInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInsightPlan): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedInsightPlanRequiredCodeRule implements WeightedInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedInsightPlanRequiredNameRule implements WeightedInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted insight plan. */
export class WeightedInsightPlanValidator {
  rules: WeightedInsightPlanRule[];

  constructor(rules: WeightedInsightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedInsightPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedInsightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedInsightPlan[]): Map<string, string[]> {
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

export function defaultWeightedInsightPlanValidator(): WeightedInsightPlanValidator {
  return new WeightedInsightPlanValidator(
    [
      new WeightedInsightPlanNameLengthRule(120),
      new WeightedInsightPlanUtmSourceLengthRule(120),
      new WeightedInsightPlanAttemptsRangeRule(16, 64),
      new WeightedInsightPlanRequiredCodeRule("weighted insight plan needs a value"),
      new WeightedInsightPlanRequiredNameRule("weighted insight plan needs this field"),
    ],
  );
}
