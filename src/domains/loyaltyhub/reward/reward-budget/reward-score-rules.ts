import { RewardScore } from "./reward-score.js";

/** A rule a reward score must pass. Check returns its problems, or none. */
export interface RewardScoreRule {
  check(item: RewardScore): string[];
}

export class RewardScoreBidRangeRule implements RewardScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardScore): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardScoreFloorValueRangeRule implements RewardScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardScore): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardScoreNameLengthRule implements RewardScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardScoreNotesLengthRule implements RewardScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardScore): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardScoreCampaignRefLengthRule implements RewardScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardScore): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward score. */
export class RewardScoreValidator {
  rules: RewardScoreRule[];

  constructor(rules: RewardScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RewardScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardScore[]): Map<string, string[]> {
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

export function defaultRewardScoreValidator(): RewardScoreValidator {
  return new RewardScoreValidator(
    [
      new RewardScoreBidRangeRule(6.7, 4545.1),
      new RewardScoreFloorValueRangeRule(0.8, 3839),
      new RewardScoreNameLengthRule(1000),
      new RewardScoreNotesLengthRule(16),
      new RewardScoreCampaignRefLengthRule(86400),
    ],
  );
}
