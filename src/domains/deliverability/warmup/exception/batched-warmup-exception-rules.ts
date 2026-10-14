import { BatchedWarmupException } from "./batched-warmup-exception.js";

/** A rule a batched warmup exception must pass. Check returns its problems, or none. */
export interface BatchedWarmupExceptionRule {
  check(item: BatchedWarmupException): string[];
}

export class BatchedWarmupExceptionCodePrefixRule implements BatchedWarmupExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedWarmupException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedWarmupExceptionRequiredPhoneRule implements BatchedWarmupExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWarmupException): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWarmupExceptionScoreRangeRule implements BatchedWarmupExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWarmupException): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedWarmupExceptionPhoneLengthRule implements BatchedWarmupExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWarmupException): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWarmupExceptionAudienceIdLengthRule implements BatchedWarmupExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWarmupException): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWarmupExceptionRequiredCodeRule implements BatchedWarmupExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWarmupException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched warmup exception. */
export class BatchedWarmupExceptionValidator {
  rules: BatchedWarmupExceptionRule[];

  constructor(rules: BatchedWarmupExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWarmupException): string[] {
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

  requireValid(item: BatchedWarmupException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWarmupException[]): Map<string, string[]> {
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

export function defaultBatchedWarmupExceptionValidator(): BatchedWarmupExceptionValidator {
  return new BatchedWarmupExceptionValidator(
    [
      new BatchedWarmupExceptionCodePrefixRule("Q"),
      new BatchedWarmupExceptionRequiredPhoneRule("batched warmup exception needs this field"),
      new BatchedWarmupExceptionScoreRangeRule(7.2, 3819.1),
      new BatchedWarmupExceptionPhoneLengthRule(32),
      new BatchedWarmupExceptionAudienceIdLengthRule(255),
      new BatchedWarmupExceptionRequiredCodeRule("batched warmup exception needs a value"),
    ],
  );
}
