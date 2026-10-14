import { PostBatch } from "./post-batch.js";

/** A rule a post batch must pass. Check returns its problems, or none. */
export interface PostBatchRule {
  check(item: PostBatch): string[];
}

export class PostBatchRequiredCodeRule implements PostBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostBatchCodeLengthRule implements PostBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostBatchNameLengthRule implements PostBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostBatchCodePrefixRule implements PostBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostBatchEndsAtRangeRule implements PostBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostBatch): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PostBatchRequiredJourneyIdRule implements PostBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostBatch): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post batch. */
export class PostBatchValidator {
  rules: PostBatchRule[];

  constructor(rules: PostBatchRule[]) {
    this.rules = rules;
  }

  validate(item: PostBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostBatch[]): Map<string, string[]> {
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

export function defaultPostBatchValidator(): PostBatchValidator {
  return new PostBatchValidator(
    [
      new PostBatchRequiredCodeRule("post batch needs an entry"),
      new PostBatchCodeLengthRule(16),
      new PostBatchNameLengthRule(16),
      new PostBatchCodePrefixRule("REF"),
      new PostBatchEndsAtRangeRule(64, 120),
      new PostBatchRequiredJourneyIdRule("post batch needs this field"),
    ],
  );
}
