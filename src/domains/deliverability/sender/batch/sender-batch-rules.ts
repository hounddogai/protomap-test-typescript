import * as text from "../../../../kit/text.js";
import { SenderBatch } from "./sender-batch.js";

/** A rule a sender batch must pass. Check returns its problems, or none. */
export interface SenderBatchRule {
  check(item: SenderBatch): string[];
}

export class SenderBatchLimitRangeRule implements SenderBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderBatch): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderBatchAllowedReviewerRule implements SenderBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is unknown`];
    return [];
  }
}

export class SenderBatchExpiresAtRangeRule implements SenderBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderBatch): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a sender batch. */
export class SenderBatchValidator {
  rules: SenderBatchRule[];

  constructor(rules: SenderBatchRule[]) {
    this.rules = rules;
  }

  validate(item: SenderBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderBatch[]): Map<string, string[]> {
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

export function defaultSenderBatchValidator(): SenderBatchValidator {
  return new SenderBatchValidator(
    [
      new SenderBatchLimitRangeRule(120, 120),
      new SenderBatchAllowedReviewerRule([]),
      new SenderBatchExpiresAtRangeRule(64, 3600),
    ],
  );
}
