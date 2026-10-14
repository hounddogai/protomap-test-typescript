import { RegionalRewardRollup } from "./regional-reward-rollup.js";

/** A rule a regional reward rollup must pass. Check returns its problems, or none. */
export interface RegionalRewardRollupRule {
  check(item: RegionalRewardRollup): string[];
}

export class RegionalRewardRollupGraceDaysRangeRule implements RegionalRewardRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalRewardRollup): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalRewardRollupRequiredLocaleRule implements RegionalRewardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRewardRollup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalRewardRollupRequiredCodeRule implements RegionalRewardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRewardRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalRewardRollupLocaleLengthRule implements RegionalRewardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRewardRollup): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRewardRollupCodeLengthRule implements RegionalRewardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRewardRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRewardRollupScoreRangeRule implements RegionalRewardRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalRewardRollup): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional reward rollup. */
export class RegionalRewardRollupValidator {
  rules: RegionalRewardRollupRule[];

  constructor(rules: RegionalRewardRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalRewardRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalRewardRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalRewardRollup[]): Map<string, string[]> {
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

export function defaultRegionalRewardRollupValidator(): RegionalRewardRollupValidator {
  return new RegionalRewardRollupValidator(
    [
      new RegionalRewardRollupGraceDaysRangeRule(255, 86400),
      new RegionalRewardRollupRequiredLocaleRule("regional reward rollup needs an entry"),
      new RegionalRewardRollupRequiredCodeRule("regional reward rollup needs a value"),
      new RegionalRewardRollupLocaleLengthRule(32),
      new RegionalRewardRollupCodeLengthRule(86400),
      new RegionalRewardRollupScoreRangeRule(0.2, 3393.3),
    ],
  );
}
