import { WeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

/** A rule a weighted enrollment slot must pass. Check returns its problems, or none. */
export interface WeightedEnrollmentSlotRule {
  check(item: WeightedEnrollmentSlot): string[];
}

export class WeightedEnrollmentSlotRequiredTitleRule implements WeightedEnrollmentSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEnrollmentSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedEnrollmentSlotGraceDaysRangeRule implements WeightedEnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEnrollmentSlot): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedEnrollmentSlotRequiredCodeRule implements WeightedEnrollmentSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEnrollmentSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedEnrollmentSlotDescriptionLengthRule implements WeightedEnrollmentSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEnrollmentSlot): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEnrollmentSlotRatioRangeRule implements WeightedEnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEnrollmentSlot): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a weighted enrollment slot. */
export class WeightedEnrollmentSlotValidator {
  rules: WeightedEnrollmentSlotRule[];

  constructor(rules: WeightedEnrollmentSlotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEnrollmentSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedEnrollmentSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEnrollmentSlot[]): Map<string, string[]> {
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

export function defaultWeightedEnrollmentSlotValidator(): WeightedEnrollmentSlotValidator {
  return new WeightedEnrollmentSlotValidator(
    [
      new WeightedEnrollmentSlotRequiredTitleRule("weighted enrollment slot needs an entry"),
      new WeightedEnrollmentSlotGraceDaysRangeRule(16, 16),
      new WeightedEnrollmentSlotRequiredCodeRule("weighted enrollment slot needs a value"),
      new WeightedEnrollmentSlotDescriptionLengthRule(120),
      new WeightedEnrollmentSlotRatioRangeRule(7.7, 2722.7),
    ],
  );
}
