import { TieredRewardCheckpoint } from "./tiered-reward-checkpoint.js";

/** A rule a tiered reward checkpoint must pass. Check returns its problems, or none. */
export interface TieredRewardCheckpointRule {
  check(item: TieredRewardCheckpoint): string[];
}

export class TieredRewardCheckpointRequiredCampaignRefRule implements TieredRewardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardCheckpoint): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardCheckpointRequiredNameRule implements TieredRewardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardCheckpointRegionLengthRule implements TieredRewardCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardCheckpoint): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardCheckpointDiscountRangeRule implements TieredRewardCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardCheckpoint): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredRewardCheckpointCodePrefixRule implements TieredRewardCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredRewardCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredRewardCheckpointThresholdRangeRule implements TieredRewardCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardCheckpoint): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered reward checkpoint. */
export class TieredRewardCheckpointValidator {
  rules: TieredRewardCheckpointRule[];

  constructor(rules: TieredRewardCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardCheckpoint): string[] {
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

  requireValid(item: TieredRewardCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardCheckpoint[]): Map<string, string[]> {
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

export function defaultTieredRewardCheckpointValidator(): TieredRewardCheckpointValidator {
  return new TieredRewardCheckpointValidator(
    [
      new TieredRewardCheckpointRequiredCampaignRefRule("tiered reward checkpoint needs a value"),
      new TieredRewardCheckpointRequiredNameRule("tiered reward checkpoint needs this field"),
      new TieredRewardCheckpointRegionLengthRule(1000),
      new TieredRewardCheckpointDiscountRangeRule(2, 2693.8),
      new TieredRewardCheckpointCodePrefixRule("OPS"),
      new TieredRewardCheckpointThresholdRangeRule(6.4, 488.8),
    ],
  );
}
