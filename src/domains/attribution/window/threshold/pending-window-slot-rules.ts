import * as text from "../../../../kit/text.js";
import { PendingWindowSlot } from "./pending-window-slot.js";

/** A rule a pending window slot must pass. Check returns its problems, or none. */
export interface PendingWindowSlotRule {
  check(item: PendingWindowSlot): string[];
}

export class PendingWindowSlotFrequencyCapRangeRule implements PendingWindowSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingWindowSlot): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingWindowSlotQuantityRangeRule implements PendingWindowSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingWindowSlot): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingWindowSlotCapacityRangeRule implements PendingWindowSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingWindowSlot): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingWindowSlotAllowedOwnerIdRule implements PendingWindowSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingWindowSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is not allowed`];
    return [];
  }
}

/** Runs every rule of a pending window slot. */
export class PendingWindowSlotValidator {
  rules: PendingWindowSlotRule[];

  constructor(rules: PendingWindowSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingWindowSlot): string[] {
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

  requireValid(item: PendingWindowSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingWindowSlot[]): Map<string, string[]> {
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

export function defaultPendingWindowSlotValidator(): PendingWindowSlotValidator {
  return new PendingWindowSlotValidator(
    [
      new PendingWindowSlotFrequencyCapRangeRule(255, 86400),
      new PendingWindowSlotQuantityRangeRule(16, 64),
      new PendingWindowSlotCapacityRangeRule(255, 1000),
      new PendingWindowSlotAllowedOwnerIdRule(["manual", "capped", "global"]),
    ],
  );
}
