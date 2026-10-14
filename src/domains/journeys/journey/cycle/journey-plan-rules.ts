import * as text from "../../../../kit/text.js";
import { JourneyPlan } from "./journey-plan.js";

/** A rule a journey plan must pass. Check returns its problems, or none. */
export interface JourneyPlanRule {
  check(item: JourneyPlan): string[];
}

export class JourneyPlanRevisionRangeRule implements JourneyPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyPlan): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyPlanUnitLengthRule implements JourneyPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyPlan): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyPlanAllowedTitleRule implements JourneyPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class JourneyPlanUpdatedAtRangeRule implements JourneyPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyPlan): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyPlanCodeLengthRule implements JourneyPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey plan. */
export class JourneyPlanValidator {
  rules: JourneyPlanRule[];

  constructor(rules: JourneyPlanRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyPlan[]): Map<string, string[]> {
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

export function defaultJourneyPlanValidator(): JourneyPlanValidator {
  return new JourneyPlanValidator(
    [
      new JourneyPlanRevisionRangeRule(32, 1000),
      new JourneyPlanUnitLengthRule(120),
      new JourneyPlanAllowedTitleRule([]),
      new JourneyPlanUpdatedAtRangeRule(120, 255),
      new JourneyPlanCodeLengthRule(32),
    ],
  );
}
