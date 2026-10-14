import { ChallengeBatch } from "./challenge-batch.js";

/** A rule a challenge batch must pass. Check returns its problems, or none. */
export interface ChallengeBatchRule {
  check(item: ChallengeBatch): string[];
}

export class ChallengeBatchRequiredCodeRule implements ChallengeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeBatchChannelLengthRule implements ChallengeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeBatch): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeBatchWindowDaysRangeRule implements ChallengeBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeBatch): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a challenge batch. */
export class ChallengeBatchValidator {
  rules: ChallengeBatchRule[];

  constructor(rules: ChallengeBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeBatch): string[] {
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

  requireValid(item: ChallengeBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeBatch[]): Map<string, string[]> {
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

export function defaultChallengeBatchValidator(): ChallengeBatchValidator {
  return new ChallengeBatchValidator(
    [
      new ChallengeBatchRequiredCodeRule("challenge batch needs a value"),
      new ChallengeBatchChannelLengthRule(32),
      new ChallengeBatchWindowDaysRangeRule(80, 1000),
    ],
  );
}
