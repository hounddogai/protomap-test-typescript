import { WeightedChallengeSlot } from "./weighted-challenge-slot.js";

/** A rule a weighted challenge slot must pass. Check returns its problems, or none. */
export interface WeightedChallengeSlotRule {
  check(item: WeightedChallengeSlot): string[];
}

export class WeightedChallengeSlotWindowDaysRangeRule implements WeightedChallengeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedChallengeSlot): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedChallengeSlotCodeLengthRule implements WeightedChallengeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedChallengeSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedChallengeSlotBatchSizeRangeRule implements WeightedChallengeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedChallengeSlot): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedChallengeSlotMinimumRangeRule implements WeightedChallengeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedChallengeSlot): string[] {
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

/** Runs every rule of a weighted challenge slot. */
export class WeightedChallengeSlotValidator {
  rules: WeightedChallengeSlotRule[];

  constructor(rules: WeightedChallengeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedChallengeSlot): string[] {
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

  requireValid(item: WeightedChallengeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedChallengeSlot[]): Map<string, string[]> {
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

export function defaultWeightedChallengeSlotValidator(): WeightedChallengeSlotValidator {
  return new WeightedChallengeSlotValidator(
    [
      new WeightedChallengeSlotWindowDaysRangeRule(1000, 3600),
      new WeightedChallengeSlotCodeLengthRule(3600),
      new WeightedChallengeSlotBatchSizeRangeRule(32, 86400),
      new WeightedChallengeSlotMinimumRangeRule(0.6, 2954.6),
    ],
  );
}
