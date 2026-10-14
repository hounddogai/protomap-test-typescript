import { WeightedFrequencySlot } from "./weighted-frequency-slot.js";

/** A rule a weighted frequency slot must pass. Check returns its problems, or none. */
export interface WeightedFrequencySlotRule {
  check(item: WeightedFrequencySlot): string[];
}

export class WeightedFrequencySlotTitleLengthRule implements WeightedFrequencySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFrequencySlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFrequencySlotFloorValueRangeRule implements WeightedFrequencySlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedFrequencySlot): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedFrequencySlotRequiredCodeRule implements WeightedFrequencySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFrequencySlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted frequency slot. */
export class WeightedFrequencySlotValidator {
  rules: WeightedFrequencySlotRule[];

  constructor(rules: WeightedFrequencySlotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFrequencySlot): string[] {
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

  requireValid(item: WeightedFrequencySlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFrequencySlot[]): Map<string, string[]> {
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

export function defaultWeightedFrequencySlotValidator(): WeightedFrequencySlotValidator {
  return new WeightedFrequencySlotValidator(
    [
      new WeightedFrequencySlotTitleLengthRule(255),
      new WeightedFrequencySlotFloorValueRangeRule(7.6, 4381.5),
      new WeightedFrequencySlotRequiredCodeRule("weighted frequency slot needs an entry"),
    ],
  );
}
