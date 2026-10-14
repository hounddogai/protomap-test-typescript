import { SeasonalChallengeException } from "./seasonal-challenge-exception.js";

/** A rule a seasonal challenge exception must pass. Check returns its problems, or none. */
export interface SeasonalChallengeExceptionRule {
  check(item: SeasonalChallengeException): string[];
}

export class SeasonalChallengeExceptionAttemptsRangeRule implements SeasonalChallengeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalChallengeException): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalChallengeExceptionApprovedGuardRule implements SeasonalChallengeExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalChallengeException): string[] {
    if (item.approved && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class SeasonalChallengeExceptionRequiredCodeRule implements SeasonalChallengeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalChallengeException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalChallengeExceptionNameLengthRule implements SeasonalChallengeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalChallengeException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal challenge exception. */
export class SeasonalChallengeExceptionValidator {
  rules: SeasonalChallengeExceptionRule[];

  constructor(rules: SeasonalChallengeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalChallengeException): string[] {
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

  requireValid(item: SeasonalChallengeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalChallengeException[]): Map<string, string[]> {
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

export function defaultSeasonalChallengeExceptionValidator(): SeasonalChallengeExceptionValidator {
  return new SeasonalChallengeExceptionValidator(
    [
      new SeasonalChallengeExceptionAttemptsRangeRule(32, 64),
      new SeasonalChallengeExceptionApprovedGuardRule(120),
      new SeasonalChallengeExceptionRequiredCodeRule("seasonal challenge exception needs a value"),
      new SeasonalChallengeExceptionNameLengthRule(255),
    ],
  );
}
