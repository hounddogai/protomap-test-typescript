import { ScheduledPostScore } from "./scheduled-post-score.js";

/** A rule a scheduled post score must pass. Check returns its problems, or none. */
export interface ScheduledPostScoreRule {
  check(item: ScheduledPostScore): string[];
}

export class ScheduledPostScoreCodeLengthRule implements ScheduledPostScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPostScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPostScoreCodePrefixRule implements ScheduledPostScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPostScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledPostScoreWeightRangeRule implements ScheduledPostScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPostScore): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled post score. */
export class ScheduledPostScoreValidator {
  rules: ScheduledPostScoreRule[];

  constructor(rules: ScheduledPostScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPostScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPostScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPostScore[]): Map<string, string[]> {
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

export function defaultScheduledPostScoreValidator(): ScheduledPostScoreValidator {
  return new ScheduledPostScoreValidator(
    [
      new ScheduledPostScoreCodeLengthRule(3600),
      new ScheduledPostScoreCodePrefixRule("REF"),
      new ScheduledPostScoreWeightRangeRule(8.8, 1020.9),
    ],
  );
}
