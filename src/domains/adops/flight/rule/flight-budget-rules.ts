import { FlightBudget } from "./flight-budget.js";

/** A rule a flight budget must pass. Check returns its problems, or none. */
export interface FlightBudgetRule {
  check(item: FlightBudget): string[];
}

export class FlightBudgetScoreRangeRule implements FlightBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightBudget): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FlightBudgetPinnedGuardRule implements FlightBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FlightBudget): string[] {
    if (item.pinned && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class FlightBudgetRequiredUnitRule implements FlightBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightBudget): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class FlightBudgetUnitLengthRule implements FlightBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightBudget): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a flight budget. */
export class FlightBudgetValidator {
  rules: FlightBudgetRule[];

  constructor(rules: FlightBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FlightBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightBudget[]): Map<string, string[]> {
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

export function defaultFlightBudgetValidator(): FlightBudgetValidator {
  return new FlightBudgetValidator(
    [
      new FlightBudgetScoreRangeRule(6, 877.1),
      new FlightBudgetPinnedGuardRule(1.2),
      new FlightBudgetRequiredUnitRule("flight budget needs this field"),
      new FlightBudgetUnitLengthRule(86400),
    ],
  );
}
