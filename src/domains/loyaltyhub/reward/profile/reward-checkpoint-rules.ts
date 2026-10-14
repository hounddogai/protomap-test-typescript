import * as text from "../../../../kit/text.js";
import { RewardCheckpoint } from "./reward-checkpoint.js";

/** A rule a reward checkpoint must pass. Check returns its problems, or none. */
export interface RewardCheckpointRule {
  check(item: RewardCheckpoint): string[];
}

export class RewardCheckpointRequiredCampaignRefRule implements RewardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardCheckpoint): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RewardCheckpointCodeLengthRule implements RewardCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardCheckpointRequiredJourneyIdRule implements RewardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardCheckpoint): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class RewardCheckpointAllowedCampaignRefRule implements RewardCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is inconsistent`];
    return [];
  }
}

export class RewardCheckpointEndsAtRangeRule implements RewardCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardCheckpoint): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardCheckpointNameLengthRule implements RewardCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward checkpoint. */
export class RewardCheckpointValidator {
  rules: RewardCheckpointRule[];

  constructor(rules: RewardCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: RewardCheckpoint): string[] {
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

  requireValid(item: RewardCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardCheckpoint[]): Map<string, string[]> {
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

export function defaultRewardCheckpointValidator(): RewardCheckpointValidator {
  return new RewardCheckpointValidator(
    [
      new RewardCheckpointRequiredCampaignRefRule("reward checkpoint needs a value"),
      new RewardCheckpointCodeLengthRule(32),
      new RewardCheckpointRequiredJourneyIdRule("reward checkpoint needs this field"),
      new RewardCheckpointAllowedCampaignRefRule(["default", "pending", "scheduled"]),
      new RewardCheckpointEndsAtRangeRule(80, 3600),
      new RewardCheckpointNameLengthRule(3600),
    ],
  );
}
