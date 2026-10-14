import * as text from "../../../../kit/text.js";
import { InviteSlot } from "./invite-slot.js";

/** A rule a invite slot must pass. Check returns its problems, or none. */
export interface InviteSlotRule {
  check(item: InviteSlot): string[];
}

export class InviteSlotAllowedTimezoneRule implements InviteSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is stale`];
    return [];
  }
}

export class InviteSlotUnitLengthRule implements InviteSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteSlot): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteSlotCeilingRangeRule implements InviteSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteSlot): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteSlotPriorityRangeRule implements InviteSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteSlot): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a invite slot. */
export class InviteSlotValidator {
  rules: InviteSlotRule[];

  constructor(rules: InviteSlotRule[]) {
    this.rules = rules;
  }

  validate(item: InviteSlot): string[] {
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

  requireValid(item: InviteSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteSlot[]): Map<string, string[]> {
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

export function defaultInviteSlotValidator(): InviteSlotValidator {
  return new InviteSlotValidator(
    [
      new InviteSlotAllowedTimezoneRule(["lenient"]),
      new InviteSlotUnitLengthRule(80),
      new InviteSlotCeilingRangeRule(7.7, 4524.6),
      new InviteSlotPriorityRangeRule(64, 120),
    ],
  );
}
