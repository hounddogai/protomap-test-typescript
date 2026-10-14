import { TicketViewBudget } from "./ticket-view-budget.js";

/** A rule a ticket view budget must pass. Check returns its problems, or none. */
export interface TicketViewBudgetRule {
  check(item: TicketViewBudget): string[];
}

export class TicketViewBudgetCodeLengthRule implements TicketViewBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewBudgetArchivedGuardRule implements TicketViewBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TicketViewBudget): string[] {
    if (item.archived && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class TicketViewBudgetImpressionsRangeRule implements TicketViewBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewBudget): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewBudgetRequiredChannelRule implements TicketViewBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view budget. */
export class TicketViewBudgetValidator {
  rules: TicketViewBudgetRule[];

  constructor(rules: TicketViewBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewBudget[]): Map<string, string[]> {
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

export function defaultTicketViewBudgetValidator(): TicketViewBudgetValidator {
  return new TicketViewBudgetValidator(
    [
      new TicketViewBudgetCodeLengthRule(86400),
      new TicketViewBudgetArchivedGuardRule(255),
      new TicketViewBudgetImpressionsRangeRule(64, 1000),
      new TicketViewBudgetRequiredChannelRule("ticket view budget needs this field"),
    ],
  );
}
