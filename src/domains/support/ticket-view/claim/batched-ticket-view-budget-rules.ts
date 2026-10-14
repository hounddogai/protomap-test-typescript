import * as text from "../../../../kit/text.js";
import { BatchedTicketViewBudget } from "./batched-ticket-view-budget.js";

/** A rule a batched ticket view budget must pass. Check returns its problems, or none. */
export interface BatchedTicketViewBudgetRule {
  check(item: BatchedTicketViewBudget): string[];
}

export class BatchedTicketViewBudgetRequiredLabelRule implements BatchedTicketViewBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedTicketViewBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedTicketViewBudgetRequiredCodeRule implements BatchedTicketViewBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedTicketViewBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedTicketViewBudgetAllowedLabelRule implements BatchedTicketViewBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedTicketViewBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class BatchedTicketViewBudgetQuantityRangeRule implements BatchedTicketViewBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTicketViewBudget): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTicketViewBudgetVersionRangeRule implements BatchedTicketViewBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTicketViewBudget): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched ticket view budget. */
export class BatchedTicketViewBudgetValidator {
  rules: BatchedTicketViewBudgetRule[];

  constructor(rules: BatchedTicketViewBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTicketViewBudget): string[] {
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

  requireValid(item: BatchedTicketViewBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTicketViewBudget[]): Map<string, string[]> {
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

export function defaultBatchedTicketViewBudgetValidator(): BatchedTicketViewBudgetValidator {
  return new BatchedTicketViewBudgetValidator(
    [
      new BatchedTicketViewBudgetRequiredLabelRule("batched ticket view budget needs a value"),
      new BatchedTicketViewBudgetRequiredCodeRule("batched ticket view budget needs a value"),
      new BatchedTicketViewBudgetAllowedLabelRule(["tiered", "regional"]),
      new BatchedTicketViewBudgetQuantityRangeRule(16, 120),
      new BatchedTicketViewBudgetVersionRangeRule(3600, 86400),
    ],
  );
}
