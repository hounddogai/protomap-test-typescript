import { AdaptiveStreakScore } from "./adaptive-streak-score.js";

/** A rule a adaptive streak score must pass. Check returns its problems, or none. */
export interface AdaptiveStreakScoreRule {
  check(item: AdaptiveStreakScore): string[];
}

export class AdaptiveStreakScoreCodeLengthRule implements AdaptiveStreakScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveStreakScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveStreakScoreCostRangeRule implements AdaptiveStreakScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveStreakScore): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveStreakScoreNameLengthRule implements AdaptiveStreakScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveStreakScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveStreakScoreRequiredCodeRule implements AdaptiveStreakScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveStreakScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive streak score. */
export class AdaptiveStreakScoreValidator {
  rules: AdaptiveStreakScoreRule[];

  constructor(rules: AdaptiveStreakScoreRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveStreakScore): string[] {
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

  requireValid(item: AdaptiveStreakScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveStreakScore[]): Map<string, string[]> {
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

export function defaultAdaptiveStreakScoreValidator(): AdaptiveStreakScoreValidator {
  return new AdaptiveStreakScoreValidator(
    [
      new AdaptiveStreakScoreCodeLengthRule(64),
      new AdaptiveStreakScoreCostRangeRule(4.1, 4258.9),
      new AdaptiveStreakScoreNameLengthRule(86400),
      new AdaptiveStreakScoreRequiredCodeRule("adaptive streak score needs this field"),
    ],
  );
}
