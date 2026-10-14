import { RetentionProfile } from "./retention-profile.js";

/** A rule a retention profile must pass. Check returns its problems, or none. */
export interface RetentionProfileRule {
  check(item: RetentionProfile): string[];
}

export class RetentionProfileRequiredSummaryRule implements RetentionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionProfile): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionProfileLabelLengthRule implements RetentionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionProfileCostRangeRule implements RetentionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionProfile): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a retention profile. */
export class RetentionProfileValidator {
  rules: RetentionProfileRule[];

  constructor(rules: RetentionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionProfile[]): Map<string, string[]> {
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

export function defaultRetentionProfileValidator(): RetentionProfileValidator {
  return new RetentionProfileValidator(
    [
      new RetentionProfileRequiredSummaryRule("retention profile needs an entry"),
      new RetentionProfileLabelLengthRule(120),
      new RetentionProfileCostRangeRule(3.1, 4291.3),
    ],
  );
}
