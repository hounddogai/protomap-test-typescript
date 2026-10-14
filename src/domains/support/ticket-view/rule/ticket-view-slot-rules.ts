import { TicketViewSlot } from "./ticket-view-slot.js";

/** A rule a ticket view slot must pass. Check returns its problems, or none. */
export interface TicketViewSlotRule {
  check(item: TicketViewSlot): string[];
}

export class TicketViewSlotVersionRangeRule implements TicketViewSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewSlot): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewSlotRequiredTitleRule implements TicketViewSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewSlotCodeLengthRule implements TicketViewSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewSlotPinnedGuardRule implements TicketViewSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TicketViewSlot): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TicketViewSlotRequiredCodeRule implements TicketViewSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewSlotTitleLengthRule implements TicketViewSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view slot. */
export class TicketViewSlotValidator {
  rules: TicketViewSlotRule[];

  constructor(rules: TicketViewSlotRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewSlot[]): Map<string, string[]> {
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

export function defaultTicketViewSlotValidator(): TicketViewSlotValidator {
  return new TicketViewSlotValidator(
    [
      new TicketViewSlotVersionRangeRule(1000, 3600),
      new TicketViewSlotRequiredTitleRule("ticket view slot needs this field"),
      new TicketViewSlotCodeLengthRule(16),
      new TicketViewSlotPinnedGuardRule(255),
      new TicketViewSlotRequiredCodeRule("ticket view slot needs an entry"),
      new TicketViewSlotTitleLengthRule(80),
    ],
  );
}
