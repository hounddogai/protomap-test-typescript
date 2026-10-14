import * as text from "../../../../kit/text.js";
import { BatchedFlightBudget } from "./batched-flight-budget.js";

/** A rule a batched flight budget must pass. Check returns its problems, or none. */
export interface BatchedFlightBudgetRule {
  check(item: BatchedFlightBudget): string[];
}

export class BatchedFlightBudgetRequiredTimezoneRule implements BatchedFlightBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightBudget): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightBudgetRequiredLocaleRule implements BatchedFlightBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightBudget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightBudgetCodePrefixRule implements BatchedFlightBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFlightBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFlightBudgetAllowedLocaleRule implements BatchedFlightBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedFlightBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

/** Runs every rule of a batched flight budget. */
export class BatchedFlightBudgetValidator {
  rules: BatchedFlightBudgetRule[];

  constructor(rules: BatchedFlightBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFlightBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedFlightBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFlightBudget[]): Map<string, string[]> {
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

export function defaultBatchedFlightBudgetValidator(): BatchedFlightBudgetValidator {
  return new BatchedFlightBudgetValidator(
    [
      new BatchedFlightBudgetRequiredTimezoneRule("batched flight budget needs an entry"),
      new BatchedFlightBudgetRequiredLocaleRule("batched flight budget needs an entry"),
      new BatchedFlightBudgetCodePrefixRule("ACM"),
      new BatchedFlightBudgetAllowedLocaleRule(["adaptive", "scheduled"]),
    ],
  );
}
