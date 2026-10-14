import { WeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

/** A rule a weighted touchpoint assignment must pass. Check returns its problems, or none. */
export interface WeightedTouchpointAssignmentRule {
  check(item: WeightedTouchpointAssignment): string[];
}

export class WeightedTouchpointAssignmentRequiredContactEmailRule implements WeightedTouchpointAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTouchpointAssignment): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTouchpointAssignmentCodePrefixRule implements WeightedTouchpointAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedTouchpointAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedTouchpointAssignmentQuantityRangeRule implements WeightedTouchpointAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedTouchpointAssignment): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedTouchpointAssignmentRequiredSegmentRule implements WeightedTouchpointAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTouchpointAssignment): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTouchpointAssignmentSegmentLengthRule implements WeightedTouchpointAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTouchpointAssignment): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTouchpointAssignmentRequiredLabelRule implements WeightedTouchpointAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTouchpointAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted touchpoint assignment. */
export class WeightedTouchpointAssignmentValidator {
  rules: WeightedTouchpointAssignmentRule[];

  constructor(rules: WeightedTouchpointAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTouchpointAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedTouchpointAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTouchpointAssignment[]): Map<string, string[]> {
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

export function defaultWeightedTouchpointAssignmentValidator(): WeightedTouchpointAssignmentValidator {
  return new WeightedTouchpointAssignmentValidator(
    [
      new WeightedTouchpointAssignmentRequiredContactEmailRule("weighted touchpoint assignment needs a value"),
      new WeightedTouchpointAssignmentCodePrefixRule("X"),
      new WeightedTouchpointAssignmentQuantityRangeRule(80, 86400),
      new WeightedTouchpointAssignmentRequiredSegmentRule("weighted touchpoint assignment needs this field"),
      new WeightedTouchpointAssignmentSegmentLengthRule(255),
      new WeightedTouchpointAssignmentRequiredLabelRule("weighted touchpoint assignment needs this field"),
    ],
  );
}
