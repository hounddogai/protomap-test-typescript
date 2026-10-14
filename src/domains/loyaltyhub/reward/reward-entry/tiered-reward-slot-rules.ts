import { TieredRewardSlot } from "./tiered-reward-slot.js";

/** A rule a tiered reward slot must pass. Check returns its problems, or none. */
export interface TieredRewardSlotRule {
  check(item: TieredRewardSlot): string[];
}

export class TieredRewardSlotNotesLengthRule implements TieredRewardSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardSlot): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardSlotRequiredNotesRule implements TieredRewardSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardSlot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardSlotBudgetRangeRule implements TieredRewardSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardSlot): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered reward slot. */
export class TieredRewardSlotValidator {
  rules: TieredRewardSlotRule[];

  constructor(rules: TieredRewardSlotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRewardSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardSlot[]): Map<string, string[]> {
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

export function defaultTieredRewardSlotValidator(): TieredRewardSlotValidator {
  return new TieredRewardSlotValidator(
    [
      new TieredRewardSlotNotesLengthRule(255),
      new TieredRewardSlotRequiredNotesRule("tiered reward slot needs a value"),
      new TieredRewardSlotBudgetRangeRule(1.4, 2598.6),
    ],
  );
}
