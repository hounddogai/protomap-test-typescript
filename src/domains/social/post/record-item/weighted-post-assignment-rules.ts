import { WeightedPostAssignment } from "./weighted-post-assignment.js";

/** A rule a weighted post assignment must pass. Check returns its problems, or none. */
export interface WeightedPostAssignmentRule {
  check(item: WeightedPostAssignment): string[];
}

export class WeightedPostAssignmentRevisionRangeRule implements WeightedPostAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPostAssignment): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedPostAssignmentRequiredCodeRule implements WeightedPostAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPostAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPostAssignmentCountryLengthRule implements WeightedPostAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPostAssignment): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPostAssignmentChannelLengthRule implements WeightedPostAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPostAssignment): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted post assignment. */
export class WeightedPostAssignmentValidator {
  rules: WeightedPostAssignmentRule[];

  constructor(rules: WeightedPostAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPostAssignment): string[] {
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

  requireValid(item: WeightedPostAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPostAssignment[]): Map<string, string[]> {
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

export function defaultWeightedPostAssignmentValidator(): WeightedPostAssignmentValidator {
  return new WeightedPostAssignmentValidator(
    [
      new WeightedPostAssignmentRevisionRangeRule(64, 86400),
      new WeightedPostAssignmentRequiredCodeRule("weighted post assignment needs this field"),
      new WeightedPostAssignmentCountryLengthRule(64),
      new WeightedPostAssignmentChannelLengthRule(80),
    ],
  );
}
