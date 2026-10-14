import { SeasonalRewardThreshold } from "./seasonal-reward-threshold.js";

/** A rule a seasonal reward threshold must pass. Check returns its problems, or none. */
export interface SeasonalRewardThresholdRule {
  check(item: SeasonalRewardThreshold): string[];
}

export class SeasonalRewardThresholdCountryLengthRule implements SeasonalRewardThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRewardThreshold): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalRewardThresholdRequiredChannelRule implements SeasonalRewardThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRewardThreshold): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalRewardThresholdPriorityRangeRule implements SeasonalRewardThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRewardThreshold): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal reward threshold. */
export class SeasonalRewardThresholdValidator {
  rules: SeasonalRewardThresholdRule[];

  constructor(rules: SeasonalRewardThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalRewardThreshold): string[] {
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

  requireValid(item: SeasonalRewardThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalRewardThreshold[]): Map<string, string[]> {
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

export function defaultSeasonalRewardThresholdValidator(): SeasonalRewardThresholdValidator {
  return new SeasonalRewardThresholdValidator(
    [
      new SeasonalRewardThresholdCountryLengthRule(64),
      new SeasonalRewardThresholdRequiredChannelRule("seasonal reward threshold needs a value"),
      new SeasonalRewardThresholdPriorityRangeRule(3600, 86400),
    ],
  );
}
