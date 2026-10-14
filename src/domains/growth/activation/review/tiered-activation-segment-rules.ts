import { TieredActivationSegment } from "./tiered-activation-segment.js";

/** A rule a tiered activation segment must pass. Check returns its problems, or none. */
export interface TieredActivationSegmentRule {
  check(item: TieredActivationSegment): string[];
}

export class TieredActivationSegmentRequiredLabelRule implements TieredActivationSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationSegmentFloorValueRangeRule implements TieredActivationSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationSegment): string[] {
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

export class TieredActivationSegmentCapacityRangeRule implements TieredActivationSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationSegment): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredActivationSegmentDiscountRangeRule implements TieredActivationSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationSegment): string[] {
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

export class TieredActivationSegmentLabelLengthRule implements TieredActivationSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered activation segment. */
export class TieredActivationSegmentValidator {
  rules: TieredActivationSegmentRule[];

  constructor(rules: TieredActivationSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredActivationSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredActivationSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredActivationSegment[]): Map<string, string[]> {
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

export function defaultTieredActivationSegmentValidator(): TieredActivationSegmentValidator {
  return new TieredActivationSegmentValidator(
    [
      new TieredActivationSegmentRequiredLabelRule("tiered activation segment needs this field"),
      new TieredActivationSegmentFloorValueRangeRule(7.4, 1344.2),
      new TieredActivationSegmentCapacityRangeRule(32, 86400),
      new TieredActivationSegmentDiscountRangeRule(0.8, 954.4),
      new TieredActivationSegmentLabelLengthRule(3600),
    ],
  );
}
