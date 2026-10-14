import { WeightedEnrollmentMilestone } from "./weighted-enrollment-milestone.js";

/** A rule a weighted enrollment milestone must pass. Check returns its problems, or none. */
export interface WeightedEnrollmentMilestoneRule {
  check(item: WeightedEnrollmentMilestone): string[];
}

export class WeightedEnrollmentMilestoneRequiredCodeRule implements WeightedEnrollmentMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEnrollmentMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedEnrollmentMilestoneCodeLengthRule implements WeightedEnrollmentMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEnrollmentMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEnrollmentMilestoneSendAtRangeRule implements WeightedEnrollmentMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEnrollmentMilestone): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedEnrollmentMilestoneTitleLengthRule implements WeightedEnrollmentMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEnrollmentMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEnrollmentMilestoneNameLengthRule implements WeightedEnrollmentMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEnrollmentMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted enrollment milestone. */
export class WeightedEnrollmentMilestoneValidator {
  rules: WeightedEnrollmentMilestoneRule[];

  constructor(rules: WeightedEnrollmentMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEnrollmentMilestone): string[] {
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

  requireValid(item: WeightedEnrollmentMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEnrollmentMilestone[]): Map<string, string[]> {
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

export function defaultWeightedEnrollmentMilestoneValidator(): WeightedEnrollmentMilestoneValidator {
  return new WeightedEnrollmentMilestoneValidator(
    [
      new WeightedEnrollmentMilestoneRequiredCodeRule("weighted enrollment milestone needs an entry"),
      new WeightedEnrollmentMilestoneCodeLengthRule(255),
      new WeightedEnrollmentMilestoneSendAtRangeRule(16, 32),
      new WeightedEnrollmentMilestoneTitleLengthRule(1000),
      new WeightedEnrollmentMilestoneNameLengthRule(255),
    ],
  );
}
