import * as text from "../../../../kit/text.js";
import { LegacyTicketViewSlot } from "./legacy-ticket-view-slot.js";

/** A rule a legacy ticket view slot must pass. Check returns its problems, or none. */
export interface LegacyTicketViewSlotRule {
  check(item: LegacyTicketViewSlot): string[];
}

export class LegacyTicketViewSlotMaximumRangeRule implements LegacyTicketViewSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTicketViewSlot): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyTicketViewSlotAllowedLabelRule implements LegacyTicketViewSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyTicketViewSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class LegacyTicketViewSlotRequiredCodeRule implements LegacyTicketViewSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyTicketViewSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyTicketViewSlotCategoryLengthRule implements LegacyTicketViewSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTicketViewSlot): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy ticket view slot. */
export class LegacyTicketViewSlotValidator {
  rules: LegacyTicketViewSlotRule[];

  constructor(rules: LegacyTicketViewSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTicketViewSlot): string[] {
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

  requireValid(item: LegacyTicketViewSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTicketViewSlot[]): Map<string, string[]> {
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

export function defaultLegacyTicketViewSlotValidator(): LegacyTicketViewSlotValidator {
  return new LegacyTicketViewSlotValidator(
    [
      new LegacyTicketViewSlotMaximumRangeRule(8.7, 3518.2),
      new LegacyTicketViewSlotAllowedLabelRule(["rolling", "pending"]),
      new LegacyTicketViewSlotRequiredCodeRule("legacy ticket view slot needs an entry"),
      new LegacyTicketViewSlotCategoryLengthRule(64),
    ],
  );
}
