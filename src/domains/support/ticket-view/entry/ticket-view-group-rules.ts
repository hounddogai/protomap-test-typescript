import { TicketViewGroup } from "./ticket-view-group.js";

/** A rule a ticket view group must pass. Check returns its problems, or none. */
export interface TicketViewGroupRule {
  check(item: TicketViewGroup): string[];
}

export class TicketViewGroupPinnedGuardRule implements TicketViewGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TicketViewGroup): string[] {
    if (item.pinned && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TicketViewGroupRequiredLocaleRule implements TicketViewGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewGroup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewGroupBudgetRangeRule implements TicketViewGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewGroup): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewGroupRequiredCodeRule implements TicketViewGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewGroupLabelLengthRule implements TicketViewGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view group. */
export class TicketViewGroupValidator {
  rules: TicketViewGroupRule[];

  constructor(rules: TicketViewGroupRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewGroup[]): Map<string, string[]> {
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

export function defaultTicketViewGroupValidator(): TicketViewGroupValidator {
  return new TicketViewGroupValidator(
    [
      new TicketViewGroupPinnedGuardRule(2.7),
      new TicketViewGroupRequiredLocaleRule("ticket view group needs an entry"),
      new TicketViewGroupBudgetRangeRule(1.8, 3164.8),
      new TicketViewGroupRequiredCodeRule("ticket view group needs this field"),
      new TicketViewGroupLabelLengthRule(64),
    ],
  );
}
