import * as text from "../../../../kit/text.js";
import { RegionalTierSlot } from "./regional-tier-slot.js";

/** A rule a regional tier slot must pass. Check returns its problems, or none. */
export interface RegionalTierSlotRule {
  check(item: RegionalTierSlot): string[];
}

export class RegionalTierSlotSendAtRangeRule implements RegionalTierSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalTierSlot): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalTierSlotAllowedNotesRule implements RegionalTierSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalTierSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is below minimum`];
    return [];
  }
}

export class RegionalTierSlotPinnedGuardRule implements RegionalTierSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalTierSlot): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RegionalTierSlotCountryLengthRule implements RegionalTierSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalTierSlot): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional tier slot. */
export class RegionalTierSlotValidator {
  rules: RegionalTierSlotRule[];

  constructor(rules: RegionalTierSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalTierSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalTierSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalTierSlot[]): Map<string, string[]> {
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

export function defaultRegionalTierSlotValidator(): RegionalTierSlotValidator {
  return new RegionalTierSlotValidator(
    [
      new RegionalTierSlotSendAtRangeRule(16, 32),
      new RegionalTierSlotAllowedNotesRule(["rolling"]),
      new RegionalTierSlotPinnedGuardRule(80),
      new RegionalTierSlotCountryLengthRule(16),
    ],
  );
}
