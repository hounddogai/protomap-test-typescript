import * as text from "../../../../kit/text.js";
import { PreferenceBudget } from "./preference-budget.js";

/** A rule a preference budget must pass. Check returns its problems, or none. */
export interface PreferenceBudgetRule {
  check(item: PreferenceBudget): string[];
}

export class PreferenceBudgetRequiredTitleRule implements PreferenceBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceBudgetCodeLengthRule implements PreferenceBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceBudgetAllowedCohortRule implements PreferenceBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is missing`];
    return [];
  }
}

export class PreferenceBudgetBidRangeRule implements PreferenceBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceBudget): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceBudgetTitleLengthRule implements PreferenceBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a preference budget. */
export class PreferenceBudgetValidator {
  rules: PreferenceBudgetRule[];

  constructor(rules: PreferenceBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceBudget[]): Map<string, string[]> {
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

export function defaultPreferenceBudgetValidator(): PreferenceBudgetValidator {
  return new PreferenceBudgetValidator(
    [
      new PreferenceBudgetRequiredTitleRule("preference budget needs a value"),
      new PreferenceBudgetCodeLengthRule(255),
      new PreferenceBudgetAllowedCohortRule(["manual", "seasonal"]),
      new PreferenceBudgetBidRangeRule(3, 809.1),
      new PreferenceBudgetTitleLengthRule(3600),
    ],
  );
}
