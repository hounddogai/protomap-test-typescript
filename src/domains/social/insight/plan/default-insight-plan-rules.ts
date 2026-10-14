import { DefaultInsightPlan } from "./default-insight-plan.js";

/** A rule a default insight plan must pass. Check returns its problems, or none. */
export interface DefaultInsightPlanRule {
  check(item: DefaultInsightPlan): string[];
}

export class DefaultInsightPlanNameLengthRule implements DefaultInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultInsightPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultInsightPlanLimitRangeRule implements DefaultInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultInsightPlan): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultInsightPlanRequiredNameRule implements DefaultInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultInsightPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default insight plan. */
export class DefaultInsightPlanValidator {
  rules: DefaultInsightPlanRule[];

  constructor(rules: DefaultInsightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultInsightPlan): string[] {
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

  requireValid(item: DefaultInsightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultInsightPlan[]): Map<string, string[]> {
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

export function defaultDefaultInsightPlanValidator(): DefaultInsightPlanValidator {
  return new DefaultInsightPlanValidator(
    [
      new DefaultInsightPlanNameLengthRule(32),
      new DefaultInsightPlanLimitRangeRule(120, 255),
      new DefaultInsightPlanRequiredNameRule("default insight plan needs a value"),
    ],
  );
}
