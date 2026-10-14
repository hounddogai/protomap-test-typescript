import * as text from "../../../../kit/text.js";
import { BatchedStreakException } from "./batched-streak-exception.js";

/** A rule a batched streak exception must pass. Check returns its problems, or none. */
export interface BatchedStreakExceptionRule {
  check(item: BatchedStreakException): string[];
}

export class BatchedStreakExceptionConversionRateRangeRule implements BatchedStreakExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedStreakException): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedStreakExceptionAllowedCodeRule implements BatchedStreakExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedStreakException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class BatchedStreakExceptionRequiredCodeRule implements BatchedStreakExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedStreakException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedStreakExceptionRequiredJourneyIdRule implements BatchedStreakExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedStreakException): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched streak exception. */
export class BatchedStreakExceptionValidator {
  rules: BatchedStreakExceptionRule[];

  constructor(rules: BatchedStreakExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedStreakException): string[] {
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

  requireValid(item: BatchedStreakException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedStreakException[]): Map<string, string[]> {
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

export function defaultBatchedStreakExceptionValidator(): BatchedStreakExceptionValidator {
  return new BatchedStreakExceptionValidator(
    [
      new BatchedStreakExceptionConversionRateRangeRule(2, 2314.5),
      new BatchedStreakExceptionAllowedCodeRule(["rolling", "fallback", "manual"]),
      new BatchedStreakExceptionRequiredCodeRule("batched streak exception needs an entry"),
      new BatchedStreakExceptionRequiredJourneyIdRule("batched streak exception needs a value"),
    ],
  );
}
