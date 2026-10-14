import { WeightedActivationSegment } from "./weighted-activation-segment.js";

/** A rule a weighted activation segment must pass. Check returns its problems, or none. */
export interface WeightedActivationSegmentRule {
  check(item: WeightedActivationSegment): string[];
}

export class WeightedActivationSegmentVariantLengthRule implements WeightedActivationSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedActivationSegment): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedActivationSegmentBudgetRangeRule implements WeightedActivationSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedActivationSegment): string[] {
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

export class WeightedActivationSegmentRequiredCodeRule implements WeightedActivationSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationSegmentRequiredTitleRule implements WeightedActivationSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationSegmentChannelLengthRule implements WeightedActivationSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedActivationSegment): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedActivationSegmentTitleLengthRule implements WeightedActivationSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedActivationSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted activation segment. */
export class WeightedActivationSegmentValidator {
  rules: WeightedActivationSegmentRule[];

  constructor(rules: WeightedActivationSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedActivationSegment): string[] {
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

  requireValid(item: WeightedActivationSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedActivationSegment[]): Map<string, string[]> {
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

export function defaultWeightedActivationSegmentValidator(): WeightedActivationSegmentValidator {
  return new WeightedActivationSegmentValidator(
    [
      new WeightedActivationSegmentVariantLengthRule(64),
      new WeightedActivationSegmentBudgetRangeRule(3.5, 3109.2),
      new WeightedActivationSegmentRequiredCodeRule("weighted activation segment needs a value"),
      new WeightedActivationSegmentRequiredTitleRule("weighted activation segment needs an entry"),
      new WeightedActivationSegmentChannelLengthRule(64),
      new WeightedActivationSegmentTitleLengthRule(1000),
    ],
  );
}
