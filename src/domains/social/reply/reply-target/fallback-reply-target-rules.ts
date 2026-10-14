import { FallbackReplyTarget } from "./fallback-reply-target.js";

/** A rule a fallback reply target must pass. Check returns its problems, or none. */
export interface FallbackReplyTargetRule {
  check(item: FallbackReplyTarget): string[];
}

export class FallbackReplyTargetScoreRangeRule implements FallbackReplyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReplyTarget): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackReplyTargetRequiredTitleRule implements FallbackReplyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackReplyTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackReplyTargetTitleLengthRule implements FallbackReplyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReplyTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackReplyTargetRequiredCohortRule implements FallbackReplyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackReplyTarget): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback reply target. */
export class FallbackReplyTargetValidator {
  rules: FallbackReplyTargetRule[];

  constructor(rules: FallbackReplyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReplyTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackReplyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReplyTarget[]): Map<string, string[]> {
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

export function defaultFallbackReplyTargetValidator(): FallbackReplyTargetValidator {
  return new FallbackReplyTargetValidator(
    [
      new FallbackReplyTargetScoreRangeRule(6, 3215.2),
      new FallbackReplyTargetRequiredTitleRule("fallback reply target needs a value"),
      new FallbackReplyTargetTitleLengthRule(3600),
      new FallbackReplyTargetRequiredCohortRule("fallback reply target needs an entry"),
    ],
  );
}
