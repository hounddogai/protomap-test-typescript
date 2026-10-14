import { ScheduledSubscriptionCycle } from "./scheduled-subscription-cycle.js";

/** A rule a scheduled subscription cycle must pass. Check returns its problems, or none. */
export interface ScheduledSubscriptionCycleRule {
  check(item: ScheduledSubscriptionCycle): string[];
}

export class ScheduledSubscriptionCyclePriorityRangeRule implements ScheduledSubscriptionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSubscriptionCycle): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledSubscriptionCycleRequiredOwnerIdRule implements ScheduledSubscriptionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSubscriptionCycle): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSubscriptionCycleRequiredNameRule implements ScheduledSubscriptionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSubscriptionCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSubscriptionCycleQuantityRangeRule implements ScheduledSubscriptionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSubscriptionCycle): string[] {
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

export class ScheduledSubscriptionCycleOwnerIdLengthRule implements ScheduledSubscriptionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionCycle): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled subscription cycle. */
export class ScheduledSubscriptionCycleValidator {
  rules: ScheduledSubscriptionCycleRule[];

  constructor(rules: ScheduledSubscriptionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSubscriptionCycle): string[] {
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

  requireValid(item: ScheduledSubscriptionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSubscriptionCycle[]): Map<string, string[]> {
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

export function defaultScheduledSubscriptionCycleValidator(): ScheduledSubscriptionCycleValidator {
  return new ScheduledSubscriptionCycleValidator(
    [
      new ScheduledSubscriptionCyclePriorityRangeRule(1000, 3600),
      new ScheduledSubscriptionCycleRequiredOwnerIdRule("scheduled subscription cycle needs this field"),
      new ScheduledSubscriptionCycleRequiredNameRule("scheduled subscription cycle needs this field"),
      new ScheduledSubscriptionCycleQuantityRangeRule(16, 3600),
      new ScheduledSubscriptionCycleOwnerIdLengthRule(64),
    ],
  );
}
