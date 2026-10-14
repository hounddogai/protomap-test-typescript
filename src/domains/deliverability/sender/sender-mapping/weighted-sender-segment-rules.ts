import { WeightedSenderSegment } from "./weighted-sender-segment.js";

/** A rule a weighted sender segment must pass. Check returns its problems, or none. */
export interface WeightedSenderSegmentRule {
  check(item: WeightedSenderSegment): string[];
}

export class WeightedSenderSegmentFrequencyCapRangeRule implements WeightedSenderSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedSenderSegment): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedSenderSegmentRequiredLabelRule implements WeightedSenderSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSenderSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedSenderSegmentCohortLengthRule implements WeightedSenderSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSenderSegment): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedSenderSegmentPriorityRangeRule implements WeightedSenderSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedSenderSegment): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted sender segment. */
export class WeightedSenderSegmentValidator {
  rules: WeightedSenderSegmentRule[];

  constructor(rules: WeightedSenderSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedSenderSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedSenderSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedSenderSegment[]): Map<string, string[]> {
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

export function defaultWeightedSenderSegmentValidator(): WeightedSenderSegmentValidator {
  return new WeightedSenderSegmentValidator(
    [
      new WeightedSenderSegmentFrequencyCapRangeRule(120, 1000),
      new WeightedSenderSegmentRequiredLabelRule("weighted sender segment needs this field"),
      new WeightedSenderSegmentCohortLengthRule(120),
      new WeightedSenderSegmentPriorityRangeRule(255, 3600),
    ],
  );
}
