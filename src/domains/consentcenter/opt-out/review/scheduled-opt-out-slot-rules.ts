import { ScheduledOptOutSlot } from "./scheduled-opt-out-slot.js";

/** A rule a scheduled opt out slot must pass. Check returns its problems, or none. */
export interface ScheduledOptOutSlotRule {
  check(item: ScheduledOptOutSlot): string[];
}

export class ScheduledOptOutSlotMaximumRangeRule implements ScheduledOptOutSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledOptOutSlot): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledOptOutSlotRequiredNameRule implements ScheduledOptOutSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledOptOutSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledOptOutSlotExpiresAtRangeRule implements ScheduledOptOutSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledOptOutSlot): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled opt out slot. */
export class ScheduledOptOutSlotValidator {
  rules: ScheduledOptOutSlotRule[];

  constructor(rules: ScheduledOptOutSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledOptOutSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledOptOutSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledOptOutSlot[]): Map<string, string[]> {
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

export function defaultScheduledOptOutSlotValidator(): ScheduledOptOutSlotValidator {
  return new ScheduledOptOutSlotValidator(
    [
      new ScheduledOptOutSlotMaximumRangeRule(9.7, 4584.5),
      new ScheduledOptOutSlotRequiredNameRule("scheduled opt out slot needs a value"),
      new ScheduledOptOutSlotExpiresAtRangeRule(64, 120),
    ],
  );
}
