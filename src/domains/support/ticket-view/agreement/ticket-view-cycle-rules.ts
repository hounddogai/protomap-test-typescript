import { TicketViewCycle } from "./ticket-view-cycle.js";

/** A rule a ticket view cycle must pass. Check returns its problems, or none. */
export interface TicketViewCycleRule {
  check(item: TicketViewCycle): string[];
}

export class TicketViewCycleRetriesRangeRule implements TicketViewCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewCycle): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewCycleTitleLengthRule implements TicketViewCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewCycleRequiredChecksumRule implements TicketViewCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewCycle): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewCycleBudgetRangeRule implements TicketViewCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewCycle): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewCycleCodeLengthRule implements TicketViewCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view cycle. */
export class TicketViewCycleValidator {
  rules: TicketViewCycleRule[];

  constructor(rules: TicketViewCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewCycle): string[] {
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

  requireValid(item: TicketViewCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewCycle[]): Map<string, string[]> {
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

export function defaultTicketViewCycleValidator(): TicketViewCycleValidator {
  return new TicketViewCycleValidator(
    [
      new TicketViewCycleRetriesRangeRule(16, 32),
      new TicketViewCycleTitleLengthRule(86400),
      new TicketViewCycleRequiredChecksumRule("ticket view cycle needs a value"),
      new TicketViewCycleBudgetRangeRule(5, 2053.5),
      new TicketViewCycleCodeLengthRule(16),
    ],
  );
}
