import { OptOutPlan } from "./opt-out-plan.js";

/** A rule a opt out plan must pass. Check returns its problems, or none. */
export interface OptOutPlanRule {
  check(item: OptOutPlan): string[];
}

export class OptOutPlanBatchSizeRangeRule implements OptOutPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutPlan): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class OptOutPlanRevisionRangeRule implements OptOutPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutPlan): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutPlanLabelLengthRule implements OptOutPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a opt out plan. */
export class OptOutPlanValidator {
  rules: OptOutPlanRule[];

  constructor(rules: OptOutPlanRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutPlan): string[] {
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

  requireValid(item: OptOutPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutPlan[]): Map<string, string[]> {
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

export function defaultOptOutPlanValidator(): OptOutPlanValidator {
  return new OptOutPlanValidator(
    [
      new OptOutPlanBatchSizeRangeRule(3600, 3600),
      new OptOutPlanRevisionRangeRule(1000, 86400),
      new OptOutPlanLabelLengthRule(80),
    ],
  );
}
