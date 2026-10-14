import { RedemptionSlot } from "./redemption-slot.js";

/** A rule a redemption slot must pass. Check returns its problems, or none. */
export interface RedemptionSlotRule {
  check(item: RedemptionSlot): string[];
}

export class RedemptionSlotCategoryLengthRule implements RedemptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionSlot): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionSlotMinimumRangeRule implements RedemptionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionSlot): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RedemptionSlotNameLengthRule implements RedemptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionSlotCodeLengthRule implements RedemptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption slot. */
export class RedemptionSlotValidator {
  rules: RedemptionSlotRule[];

  constructor(rules: RedemptionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionSlot): string[] {
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

  requireValid(item: RedemptionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionSlot[]): Map<string, string[]> {
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

export function defaultRedemptionSlotValidator(): RedemptionSlotValidator {
  return new RedemptionSlotValidator(
    [
      new RedemptionSlotCategoryLengthRule(1000),
      new RedemptionSlotMinimumRangeRule(1.8, 3893.2),
      new RedemptionSlotNameLengthRule(120),
      new RedemptionSlotCodeLengthRule(1000),
    ],
  );
}
