import { PostThreshold } from "./post-threshold.js";

/** A rule a post threshold must pass. Check returns its problems, or none. */
export interface PostThresholdRule {
  check(item: PostThreshold): string[];
}

export class PostThresholdCodePrefixRule implements PostThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostThresholdMarginRangeRule implements PostThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostThreshold): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PostThresholdSummaryLengthRule implements PostThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostThreshold): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostThresholdUnitLengthRule implements PostThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostThreshold): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post threshold. */
export class PostThresholdValidator {
  rules: PostThresholdRule[];

  constructor(rules: PostThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PostThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostThreshold[]): Map<string, string[]> {
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

export function defaultPostThresholdValidator(): PostThresholdValidator {
  return new PostThresholdValidator(
    [
      new PostThresholdCodePrefixRule("X"),
      new PostThresholdMarginRangeRule(5.4, 2265.2),
      new PostThresholdSummaryLengthRule(64),
      new PostThresholdUnitLengthRule(32),
    ],
  );
}
