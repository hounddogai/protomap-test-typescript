import { PendingSubscriptionSlot } from "./pending-subscription-slot.js";

/** A rule a pending subscription slot must pass. Check returns its problems, or none. */
export interface PendingSubscriptionSlotRule {
  check(item: PendingSubscriptionSlot): string[];
}

export class PendingSubscriptionSlotLimitRangeRule implements PendingSubscriptionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSubscriptionSlot): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingSubscriptionSlotTitleLengthRule implements PendingSubscriptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSubscriptionSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSubscriptionSlotMinimumRangeRule implements PendingSubscriptionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSubscriptionSlot): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSubscriptionSlotRequiredTitleRule implements PendingSubscriptionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSubscriptionSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSubscriptionSlotRequiredUnitRule implements PendingSubscriptionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSubscriptionSlot): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending subscription slot. */
export class PendingSubscriptionSlotValidator {
  rules: PendingSubscriptionSlotRule[];

  constructor(rules: PendingSubscriptionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSubscriptionSlot): string[] {
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

  requireValid(item: PendingSubscriptionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSubscriptionSlot[]): Map<string, string[]> {
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

export function defaultPendingSubscriptionSlotValidator(): PendingSubscriptionSlotValidator {
  return new PendingSubscriptionSlotValidator(
    [
      new PendingSubscriptionSlotLimitRangeRule(3600, 86400),
      new PendingSubscriptionSlotTitleLengthRule(1000),
      new PendingSubscriptionSlotMinimumRangeRule(1.4, 3440.5),
      new PendingSubscriptionSlotRequiredTitleRule("pending subscription slot needs this field"),
      new PendingSubscriptionSlotRequiredUnitRule("pending subscription slot needs this field"),
    ],
  );
}
