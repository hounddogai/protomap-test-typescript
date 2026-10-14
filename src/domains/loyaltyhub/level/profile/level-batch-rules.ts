import * as text from "../../../../kit/text.js";
import { LevelBatch } from "./level-batch.js";

/** A rule a level batch must pass. Check returns its problems, or none. */
export interface LevelBatchRule {
  check(item: LevelBatch): string[];
}

export class LevelBatchGraceDaysRangeRule implements LevelBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelBatch): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelBatchRatioRangeRule implements LevelBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelBatch): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelBatchAllowedNotesRule implements LevelBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is missing`];
    return [];
  }
}

/** Runs every rule of a level batch. */
export class LevelBatchValidator {
  rules: LevelBatchRule[];

  constructor(rules: LevelBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LevelBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelBatch[]): Map<string, string[]> {
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

export function defaultLevelBatchValidator(): LevelBatchValidator {
  return new LevelBatchValidator(
    [
      new LevelBatchGraceDaysRangeRule(32, 1000),
      new LevelBatchRatioRangeRule(1.8, 445.7),
      new LevelBatchAllowedNotesRule([]),
    ],
  );
}
