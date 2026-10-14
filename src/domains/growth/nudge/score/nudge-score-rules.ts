import { NudgeScore } from "./nudge-score.js";

/** A rule a nudge score must pass. Check returns its problems, or none. */
export interface NudgeScoreRule {
  check(item: NudgeScore): string[];
}

export class NudgeScoreDurationMinutesRangeRule implements NudgeScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeScore): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeScoreCodeLengthRule implements NudgeScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeScoreBatchSizeRangeRule implements NudgeScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeScore): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a nudge score. */
export class NudgeScoreValidator {
  rules: NudgeScoreRule[];

  constructor(rules: NudgeScoreRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeScore[]): Map<string, string[]> {
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

export function defaultNudgeScoreValidator(): NudgeScoreValidator {
  return new NudgeScoreValidator(
    [
      new NudgeScoreDurationMinutesRangeRule(16, 32),
      new NudgeScoreCodeLengthRule(64),
      new NudgeScoreBatchSizeRangeRule(16, 64),
    ],
  );
}
