import { FallbackTicketViewSlot } from "./fallback-ticket-view-slot.js";

/** A rule a fallback ticket view slot must pass. Check returns its problems, or none. */
export interface FallbackTicketViewSlotRule {
  check(item: FallbackTicketViewSlot): string[];
}

export class FallbackTicketViewSlotWindowDaysRangeRule implements FallbackTicketViewSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackTicketViewSlot): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackTicketViewSlotRequiredCodeRule implements FallbackTicketViewSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackTicketViewSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackTicketViewSlotApprovedGuardRule implements FallbackTicketViewSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackTicketViewSlot): string[] {
    if (item.approved && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackTicketViewSlotRequiredTitleRule implements FallbackTicketViewSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackTicketViewSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback ticket view slot. */
export class FallbackTicketViewSlotValidator {
  rules: FallbackTicketViewSlotRule[];

  constructor(rules: FallbackTicketViewSlotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackTicketViewSlot): string[] {
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

  requireValid(item: FallbackTicketViewSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackTicketViewSlot[]): Map<string, string[]> {
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

export function defaultFallbackTicketViewSlotValidator(): FallbackTicketViewSlotValidator {
  return new FallbackTicketViewSlotValidator(
    [
      new FallbackTicketViewSlotWindowDaysRangeRule(120, 86400),
      new FallbackTicketViewSlotRequiredCodeRule("fallback ticket view slot needs a value"),
      new FallbackTicketViewSlotApprovedGuardRule(0),
      new FallbackTicketViewSlotRequiredTitleRule("fallback ticket view slot needs this field"),
    ],
  );
}
