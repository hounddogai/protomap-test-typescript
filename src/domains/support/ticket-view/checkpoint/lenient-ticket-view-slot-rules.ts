import { LenientTicketViewSlot } from "./lenient-ticket-view-slot.js";

/** A rule a lenient ticket view slot must pass. Check returns its problems, or none. */
export interface LenientTicketViewSlotRule {
  check(item: LenientTicketViewSlot): string[];
}

export class LenientTicketViewSlotRequiredReviewerRule implements LenientTicketViewSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTicketViewSlot): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class LenientTicketViewSlotCostRangeRule implements LenientTicketViewSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTicketViewSlot): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientTicketViewSlotRequiredTitleRule implements LenientTicketViewSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTicketViewSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient ticket view slot. */
export class LenientTicketViewSlotValidator {
  rules: LenientTicketViewSlotRule[];

  constructor(rules: LenientTicketViewSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTicketViewSlot): string[] {
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

  requireValid(item: LenientTicketViewSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTicketViewSlot[]): Map<string, string[]> {
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

export function defaultLenientTicketViewSlotValidator(): LenientTicketViewSlotValidator {
  return new LenientTicketViewSlotValidator(
    [
      new LenientTicketViewSlotRequiredReviewerRule("lenient ticket view slot needs a value"),
      new LenientTicketViewSlotCostRangeRule(2.4, 710.8),
      new LenientTicketViewSlotRequiredTitleRule("lenient ticket view slot needs this field"),
    ],
  );
}
