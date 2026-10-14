import { PendingRewardSlot } from "./pending-reward-slot.js";

/** A rule a pending reward slot must pass. Check returns its problems, or none. */
export interface PendingRewardSlotRule {
  check(item: PendingRewardSlot): string[];
}

export class PendingRewardSlotMarginRangeRule implements PendingRewardSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardSlot): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRewardSlotRequiredVariantRule implements PendingRewardSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardSlot): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardSlotCodePrefixRule implements PendingRewardSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingRewardSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending reward slot. */
export class PendingRewardSlotValidator {
  rules: PendingRewardSlotRule[];

  constructor(rules: PendingRewardSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardSlot): string[] {
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

  requireValid(item: PendingRewardSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardSlot[]): Map<string, string[]> {
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

export function defaultPendingRewardSlotValidator(): PendingRewardSlotValidator {
  return new PendingRewardSlotValidator(
    [
      new PendingRewardSlotMarginRangeRule(3.7, 2212),
      new PendingRewardSlotRequiredVariantRule("pending reward slot needs this field"),
      new PendingRewardSlotCodePrefixRule("ACM"),
    ],
  );
}
