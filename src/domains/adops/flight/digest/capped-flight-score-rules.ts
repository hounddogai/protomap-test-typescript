import { CappedFlightScore } from "./capped-flight-score.js";

/** A rule a capped flight score must pass. Check returns its problems, or none. */
export interface CappedFlightScoreRule {
  check(item: CappedFlightScore): string[];
}

export class CappedFlightScoreWindowDaysRangeRule implements CappedFlightScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFlightScore): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedFlightScoreMinimumRangeRule implements CappedFlightScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFlightScore): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFlightScoreTitleLengthRule implements CappedFlightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFlightScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped flight score. */
export class CappedFlightScoreValidator {
  rules: CappedFlightScoreRule[];

  constructor(rules: CappedFlightScoreRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFlightScore): string[] {
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

  requireValid(item: CappedFlightScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFlightScore[]): Map<string, string[]> {
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

export function defaultCappedFlightScoreValidator(): CappedFlightScoreValidator {
  return new CappedFlightScoreValidator(
    [
      new CappedFlightScoreWindowDaysRangeRule(64, 86400),
      new CappedFlightScoreMinimumRangeRule(9.8, 3936.9),
      new CappedFlightScoreTitleLengthRule(86400),
    ],
  );
}
