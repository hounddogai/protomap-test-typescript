import { RewardSlot } from "./reward-slot.js";

/** A rule a reward slot must pass. Check returns its problems, or none. */
export interface RewardSlotRule {
  check(item: RewardSlot): string[];
}

export class RewardSlotRatioRangeRule implements RewardSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardSlot): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardSlotCodeLengthRule implements RewardSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardSlotDescriptionLengthRule implements RewardSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardSlot): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardSlotPinnedGuardRule implements RewardSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardSlot): string[] {
    if (item.pinned && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a reward slot. */
export class RewardSlotValidator {
  rules: RewardSlotRule[];

  constructor(rules: RewardSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RewardSlot): string[] {
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

  requireValid(item: RewardSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardSlot[]): Map<string, string[]> {
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

export function defaultRewardSlotValidator(): RewardSlotValidator {
  return new RewardSlotValidator(
    [
      new RewardSlotRatioRangeRule(7.8, 3091.6),
      new RewardSlotCodeLengthRule(255),
      new RewardSlotDescriptionLengthRule(32),
      new RewardSlotPinnedGuardRule(1000),
    ],
  );
}
