import { TicketViewMapping } from "./ticket-view-mapping.js";

/** A rule a ticket view mapping must pass. Check returns its problems, or none. */
export interface TicketViewMappingRule {
  check(item: TicketViewMapping): string[];
}

export class TicketViewMappingRequiredCodeRule implements TicketViewMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewMappingRequiredTitleRule implements TicketViewMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewMappingDiscountRangeRule implements TicketViewMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewMapping): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a ticket view mapping. */
export class TicketViewMappingValidator {
  rules: TicketViewMappingRule[];

  constructor(rules: TicketViewMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewMapping[]): Map<string, string[]> {
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

export function defaultTicketViewMappingValidator(): TicketViewMappingValidator {
  return new TicketViewMappingValidator(
    [
      new TicketViewMappingRequiredCodeRule("ticket view mapping needs this field"),
      new TicketViewMappingRequiredTitleRule("ticket view mapping needs a value"),
      new TicketViewMappingDiscountRangeRule(0.2, 146.8),
    ],
  );
}
