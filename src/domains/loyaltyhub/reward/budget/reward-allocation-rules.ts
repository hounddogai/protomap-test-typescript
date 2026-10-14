import * as text from "../../../../kit/text.js";
import { RewardAllocation } from "./reward-allocation.js";

/** A rule a reward allocation must pass. Check returns its problems, or none. */
export interface RewardAllocationRule {
  check(item: RewardAllocation): string[];
}

export class RewardAllocationActiveGuardRule implements RewardAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardAllocation): string[] {
    if (item.active && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RewardAllocationRequiredCampaignRefRule implements RewardAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardAllocation): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RewardAllocationAllowedLabelRule implements RewardAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class RewardAllocationCampaignRefLengthRule implements RewardAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardAllocation): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward allocation. */
export class RewardAllocationValidator {
  rules: RewardAllocationRule[];

  constructor(rules: RewardAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: RewardAllocation): string[] {
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

  requireValid(item: RewardAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardAllocation[]): Map<string, string[]> {
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

export function defaultRewardAllocationValidator(): RewardAllocationValidator {
  return new RewardAllocationValidator(
    [
      new RewardAllocationActiveGuardRule(6.7),
      new RewardAllocationRequiredCampaignRefRule("reward allocation needs a value"),
      new RewardAllocationAllowedLabelRule(["legacy", "global"]),
      new RewardAllocationCampaignRefLengthRule(1000),
    ],
  );
}
