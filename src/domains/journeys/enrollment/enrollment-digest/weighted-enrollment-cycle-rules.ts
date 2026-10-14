import * as text from "../../../../kit/text.js";
import { WeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

/** A rule a weighted enrollment cycle must pass. Check returns its problems, or none. */
export interface WeightedEnrollmentCycleRule {
  check(item: WeightedEnrollmentCycle): string[];
}

export class WeightedEnrollmentCycleRequiredContactEmailRule implements WeightedEnrollmentCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEnrollmentCycle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedEnrollmentCycleCodePrefixRule implements WeightedEnrollmentCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedEnrollmentCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedEnrollmentCycleAllowedContactEmailRule implements WeightedEnrollmentCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedEnrollmentCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is duplicated`];
    return [];
  }
}

export class WeightedEnrollmentCycleMinimumRangeRule implements WeightedEnrollmentCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEnrollmentCycle): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedEnrollmentCycleLabelLengthRule implements WeightedEnrollmentCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEnrollmentCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEnrollmentCycleRequiredCodeRule implements WeightedEnrollmentCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEnrollmentCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted enrollment cycle. */
export class WeightedEnrollmentCycleValidator {
  rules: WeightedEnrollmentCycleRule[];

  constructor(rules: WeightedEnrollmentCycleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEnrollmentCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedEnrollmentCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEnrollmentCycle[]): Map<string, string[]> {
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

export function defaultWeightedEnrollmentCycleValidator(): WeightedEnrollmentCycleValidator {
  return new WeightedEnrollmentCycleValidator(
    [
      new WeightedEnrollmentCycleRequiredContactEmailRule("weighted enrollment cycle needs a value"),
      new WeightedEnrollmentCycleCodePrefixRule("Q"),
      new WeightedEnrollmentCycleAllowedContactEmailRule([]),
      new WeightedEnrollmentCycleMinimumRangeRule(5.9, 1343.8),
      new WeightedEnrollmentCycleLabelLengthRule(255),
      new WeightedEnrollmentCycleRequiredCodeRule("weighted enrollment cycle needs a value"),
    ],
  );
}
