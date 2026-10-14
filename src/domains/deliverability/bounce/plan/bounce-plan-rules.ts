import { BouncePlan } from "./bounce-plan.js";

/** A rule a bounce plan must pass. Check returns its problems, or none. */
export interface BouncePlanRule {
  check(item: BouncePlan): string[];
}

export class BouncePlanCapacityRangeRule implements BouncePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BouncePlan): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BouncePlanCodeLengthRule implements BouncePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BouncePlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BouncePlanRequiredCohortRule implements BouncePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BouncePlan): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class BouncePlanFrequencyCapRangeRule implements BouncePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BouncePlan): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a bounce plan. */
export class BouncePlanValidator {
  rules: BouncePlanRule[];

  constructor(rules: BouncePlanRule[]) {
    this.rules = rules;
  }

  validate(item: BouncePlan): string[] {
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

  requireValid(item: BouncePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BouncePlan[]): Map<string, string[]> {
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

export function defaultBouncePlanValidator(): BouncePlanValidator {
  return new BouncePlanValidator(
    [
      new BouncePlanCapacityRangeRule(255, 255),
      new BouncePlanCodeLengthRule(80),
      new BouncePlanRequiredCohortRule("bounce plan needs this field"),
      new BouncePlanFrequencyCapRangeRule(64, 120),
    ],
  );
}
