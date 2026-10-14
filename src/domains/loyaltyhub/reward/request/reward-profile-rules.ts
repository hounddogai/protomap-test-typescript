import * as text from "../../../../kit/text.js";
import { RewardProfile } from "./reward-profile.js";

/** A rule a reward profile must pass. Check returns its problems, or none. */
export interface RewardProfileRule {
  check(item: RewardProfile): string[];
}

export class RewardProfileLabelLengthRule implements RewardProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardProfileBatchSizeRangeRule implements RewardProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardProfile): string[] {
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

export class RewardProfileRequiredCampaignRefRule implements RewardProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardProfile): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RewardProfileAllowedCategoryRule implements RewardProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is stale`];
    return [];
  }
}

export class RewardProfileVersionRangeRule implements RewardProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardProfile): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reward profile. */
export class RewardProfileValidator {
  rules: RewardProfileRule[];

  constructor(rules: RewardProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RewardProfile): string[] {
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

  requireValid(item: RewardProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardProfile[]): Map<string, string[]> {
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

export function defaultRewardProfileValidator(): RewardProfileValidator {
  return new RewardProfileValidator(
    [
      new RewardProfileLabelLengthRule(64),
      new RewardProfileBatchSizeRangeRule(120, 1000),
      new RewardProfileRequiredCampaignRefRule("reward profile needs an entry"),
      new RewardProfileAllowedCategoryRule([]),
      new RewardProfileVersionRangeRule(80, 1000),
    ],
  );
}
