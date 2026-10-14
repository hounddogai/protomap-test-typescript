import * as text from "../../../../kit/text.js";
import { TicketViewOverride } from "./ticket-view-override.js";

/** A rule a ticket view override must pass. Check returns its problems, or none. */
export interface TicketViewOverrideRule {
  check(item: TicketViewOverride): string[];
}

export class TicketViewOverrideDiscountRangeRule implements TicketViewOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewOverride): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewOverrideActiveGuardRule implements TicketViewOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TicketViewOverride): string[] {
    if (item.active && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while active`];
    return [];
  }
}

export class TicketViewOverrideRequiredTitleRule implements TicketViewOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewOverrideAllowedTitleRule implements TicketViewOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TicketViewOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class TicketViewOverrideCodeLengthRule implements TicketViewOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view override. */
export class TicketViewOverrideValidator {
  rules: TicketViewOverrideRule[];

  constructor(rules: TicketViewOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewOverride[]): Map<string, string[]> {
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

export function defaultTicketViewOverrideValidator(): TicketViewOverrideValidator {
  return new TicketViewOverrideValidator(
    [
      new TicketViewOverrideDiscountRangeRule(9, 1532.3),
      new TicketViewOverrideActiveGuardRule(120),
      new TicketViewOverrideRequiredTitleRule("ticket view override needs an entry"),
      new TicketViewOverrideAllowedTitleRule([]),
      new TicketViewOverrideCodeLengthRule(32),
    ],
  );
}
