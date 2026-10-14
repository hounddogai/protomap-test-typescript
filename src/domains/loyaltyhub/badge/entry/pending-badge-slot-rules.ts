import * as text from "../../../../kit/text.js";
import { PendingBadgeSlot } from "./pending-badge-slot.js";

/** A rule a pending badge slot must pass. Check returns its problems, or none. */
export interface PendingBadgeSlotRule {
  check(item: PendingBadgeSlot): string[];
}

export class PendingBadgeSlotLimitRangeRule implements PendingBadgeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBadgeSlot): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBadgeSlotClicksRangeRule implements PendingBadgeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBadgeSlot): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBadgeSlotRequiredCodeRule implements PendingBadgeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBadgeSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBadgeSlotAllowedLabelRule implements PendingBadgeSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingBadgeSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class PendingBadgeSlotApprovedGuardRule implements PendingBadgeSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingBadgeSlot): string[] {
    if (item.approved && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a pending badge slot. */
export class PendingBadgeSlotValidator {
  rules: PendingBadgeSlotRule[];

  constructor(rules: PendingBadgeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBadgeSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBadgeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBadgeSlot[]): Map<string, string[]> {
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

export function defaultPendingBadgeSlotValidator(): PendingBadgeSlotValidator {
  return new PendingBadgeSlotValidator(
    [
      new PendingBadgeSlotLimitRangeRule(64, 3600),
      new PendingBadgeSlotClicksRangeRule(32, 255),
      new PendingBadgeSlotRequiredCodeRule("pending badge slot needs an entry"),
      new PendingBadgeSlotAllowedLabelRule([]),
      new PendingBadgeSlotApprovedGuardRule(3600),
    ],
  );
}
