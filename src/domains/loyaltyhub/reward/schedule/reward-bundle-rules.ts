import { RewardBundle } from "./reward-bundle.js";

/** A rule a reward bundle must pass. Check returns its problems, or none. */
export interface RewardBundleRule {
  check(item: RewardBundle): string[];
}

export class RewardBundleRequiredUnitRule implements RewardBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardBundle): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class RewardBundleUtmSourceLengthRule implements RewardBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardBundle): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardBundleImpressionsRangeRule implements RewardBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardBundle): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reward bundle. */
export class RewardBundleValidator {
  rules: RewardBundleRule[];

  constructor(rules: RewardBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RewardBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardBundle[]): Map<string, string[]> {
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

export function defaultRewardBundleValidator(): RewardBundleValidator {
  return new RewardBundleValidator(
    [
      new RewardBundleRequiredUnitRule("reward bundle needs an entry"),
      new RewardBundleUtmSourceLengthRule(86400),
      new RewardBundleImpressionsRangeRule(64, 120),
    ],
  );
}
