import * as text from "../../../../kit/text.js";
import { RewardTarget } from "./reward-target.js";

/** A rule a reward target must pass. Check returns its problems, or none. */
export interface RewardTargetRule {
  check(item: RewardTarget): string[];
}

export class RewardTargetRequiredLabelRule implements RewardTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardTargetAllowedCampaignRefRule implements RewardTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is below minimum`];
    return [];
  }
}

export class RewardTargetRequiredRegionRule implements RewardTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardTarget): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RewardTargetCodePrefixRule implements RewardTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardTargetCeilingRangeRule implements RewardTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardTarget): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardTargetCodeLengthRule implements RewardTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward target. */
export class RewardTargetValidator {
  rules: RewardTargetRule[];

  constructor(rules: RewardTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RewardTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardTarget[]): Map<string, string[]> {
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

export function defaultRewardTargetValidator(): RewardTargetValidator {
  return new RewardTargetValidator(
    [
      new RewardTargetRequiredLabelRule("reward target needs a value"),
      new RewardTargetAllowedCampaignRefRule([]),
      new RewardTargetRequiredRegionRule("reward target needs a value"),
      new RewardTargetCodePrefixRule("ACM"),
      new RewardTargetCeilingRangeRule(3.6, 3357.3),
      new RewardTargetCodeLengthRule(120),
    ],
  );
}
