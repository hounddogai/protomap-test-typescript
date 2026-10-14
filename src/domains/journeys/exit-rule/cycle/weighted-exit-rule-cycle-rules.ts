import { WeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

/** A rule a weighted exit rule cycle must pass. Check returns its problems, or none. */
export interface WeightedExitRuleCycleRule {
  check(item: WeightedExitRuleCycle): string[];
}

export class WeightedExitRuleCycleCreatedAtRangeRule implements WeightedExitRuleCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedExitRuleCycle): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedExitRuleCycleRequiredTitleRule implements WeightedExitRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedExitRuleCycle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedExitRuleCycleCodeLengthRule implements WeightedExitRuleCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedExitRuleCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted exit rule cycle. */
export class WeightedExitRuleCycleValidator {
  rules: WeightedExitRuleCycleRule[];

  constructor(rules: WeightedExitRuleCycleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedExitRuleCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedExitRuleCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedExitRuleCycle[]): Map<string, string[]> {
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

export function defaultWeightedExitRuleCycleValidator(): WeightedExitRuleCycleValidator {
  return new WeightedExitRuleCycleValidator(
    [
      new WeightedExitRuleCycleCreatedAtRangeRule(32, 80),
      new WeightedExitRuleCycleRequiredTitleRule("weighted exit rule cycle needs an entry"),
      new WeightedExitRuleCycleCodeLengthRule(3600),
    ],
  );
}
