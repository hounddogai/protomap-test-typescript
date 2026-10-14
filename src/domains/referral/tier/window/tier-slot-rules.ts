import { TierSlot } from "./tier-slot.js";

/** A rule a tier slot must pass. Check returns its problems, or none. */
export interface TierSlotRule {
  check(item: TierSlot): string[];
}

export class TierSlotRequiredLabelRule implements TierSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TierSlotLabelLengthRule implements TierSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierSlotWeightRangeRule implements TierSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierSlot): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tier slot. */
export class TierSlotValidator {
  rules: TierSlotRule[];

  constructor(rules: TierSlotRule[]) {
    this.rules = rules;
  }

  validate(item: TierSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierSlot[]): Map<string, string[]> {
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

export function defaultTierSlotValidator(): TierSlotValidator {
  return new TierSlotValidator(
    [
      new TierSlotRequiredLabelRule("tier slot needs an entry"),
      new TierSlotLabelLengthRule(80),
      new TierSlotWeightRangeRule(4.2, 2554.4),
    ],
  );
}
