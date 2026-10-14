import { StreakTier } from "./streak-tier.js";

/** A rule a streak tier must pass. Check returns its problems, or none. */
export interface StreakTierRule {
  check(item: StreakTier): string[];
}

export class StreakTierFrequencyCapRangeRule implements StreakTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakTier): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakTierRequiredCodeRule implements StreakTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakTierTitleLengthRule implements StreakTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakTierChannelLengthRule implements StreakTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakTier): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakTierRequiredChannelRule implements StreakTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakTier): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak tier. */
export class StreakTierValidator {
  rules: StreakTierRule[];

  constructor(rules: StreakTierRule[]) {
    this.rules = rules;
  }

  validate(item: StreakTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakTier[]): Map<string, string[]> {
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

export function defaultStreakTierValidator(): StreakTierValidator {
  return new StreakTierValidator(
    [
      new StreakTierFrequencyCapRangeRule(32, 1000),
      new StreakTierRequiredCodeRule("streak tier needs a value"),
      new StreakTierTitleLengthRule(64),
      new StreakTierChannelLengthRule(1000),
      new StreakTierRequiredChannelRule("streak tier needs this field"),
    ],
  );
}
