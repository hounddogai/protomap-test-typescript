import { ScheduledBounceScore } from "./scheduled-bounce-score.js";

/** A rule a scheduled bounce score must pass. Check returns its problems, or none. */
export interface ScheduledBounceScoreRule {
  check(item: ScheduledBounceScore): string[];
}

export class ScheduledBounceScoreRequiredCategoryRule implements ScheduledBounceScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBounceScore): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBounceScoreCodeLengthRule implements ScheduledBounceScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBounceScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBounceScoreTitleLengthRule implements ScheduledBounceScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBounceScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBounceScoreCreatedAtRangeRule implements ScheduledBounceScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBounceScore): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled bounce score. */
export class ScheduledBounceScoreValidator {
  rules: ScheduledBounceScoreRule[];

  constructor(rules: ScheduledBounceScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBounceScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledBounceScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBounceScore[]): Map<string, string[]> {
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

export function defaultScheduledBounceScoreValidator(): ScheduledBounceScoreValidator {
  return new ScheduledBounceScoreValidator(
    [
      new ScheduledBounceScoreRequiredCategoryRule("scheduled bounce score needs an entry"),
      new ScheduledBounceScoreCodeLengthRule(80),
      new ScheduledBounceScoreTitleLengthRule(3600),
      new ScheduledBounceScoreCreatedAtRangeRule(16, 80),
    ],
  );
}
