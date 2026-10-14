import { SeasonalBadgeSlot } from "./seasonal-badge-slot.js";

/** A rule a seasonal badge slot must pass. Check returns its problems, or none. */
export interface SeasonalBadgeSlotRule {
  check(item: SeasonalBadgeSlot): string[];
}

export class SeasonalBadgeSlotRequiredNameRule implements SeasonalBadgeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBadgeSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBadgeSlotRequiredPhoneRule implements SeasonalBadgeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBadgeSlot): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBadgeSlotPhoneLengthRule implements SeasonalBadgeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBadgeSlot): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBadgeSlotDiscountRangeRule implements SeasonalBadgeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBadgeSlot): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalBadgeSlotCodeLengthRule implements SeasonalBadgeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBadgeSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBadgeSlotRequiredCodeRule implements SeasonalBadgeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBadgeSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal badge slot. */
export class SeasonalBadgeSlotValidator {
  rules: SeasonalBadgeSlotRule[];

  constructor(rules: SeasonalBadgeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBadgeSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalBadgeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBadgeSlot[]): Map<string, string[]> {
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

export function defaultSeasonalBadgeSlotValidator(): SeasonalBadgeSlotValidator {
  return new SeasonalBadgeSlotValidator(
    [
      new SeasonalBadgeSlotRequiredNameRule("seasonal badge slot needs this field"),
      new SeasonalBadgeSlotRequiredPhoneRule("seasonal badge slot needs a value"),
      new SeasonalBadgeSlotPhoneLengthRule(1000),
      new SeasonalBadgeSlotDiscountRangeRule(0.6, 2034.6),
      new SeasonalBadgeSlotCodeLengthRule(86400),
      new SeasonalBadgeSlotRequiredCodeRule("seasonal badge slot needs an entry"),
    ],
  );
}
