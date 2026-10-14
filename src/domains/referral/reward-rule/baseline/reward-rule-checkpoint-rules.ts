import { RewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

/** A rule a reward rule checkpoint must pass. Check returns its problems, or none. */
export interface RewardRuleCheckpointRule {
  check(item: RewardRuleCheckpoint): string[];
}

export class RewardRuleCheckpointPriorityRangeRule implements RewardRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleCheckpoint): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleCheckpointQuantityRangeRule implements RewardRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleCheckpoint): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleCheckpointRequiredTimezoneRule implements RewardRuleCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleCheckpoint): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleCheckpointNameLengthRule implements RewardRuleCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleCheckpointEndsAtRangeRule implements RewardRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleCheckpoint): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleCheckpointUpdatedAtRangeRule implements RewardRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleCheckpoint): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reward rule checkpoint. */
export class RewardRuleCheckpointValidator {
  rules: RewardRuleCheckpointRule[];

  constructor(rules: RewardRuleCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleCheckpoint): string[] {
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

  requireValid(item: RewardRuleCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleCheckpoint[]): Map<string, string[]> {
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

export function defaultRewardRuleCheckpointValidator(): RewardRuleCheckpointValidator {
  return new RewardRuleCheckpointValidator(
    [
      new RewardRuleCheckpointPriorityRangeRule(80, 1000),
      new RewardRuleCheckpointQuantityRangeRule(120, 255),
      new RewardRuleCheckpointRequiredTimezoneRule("reward rule checkpoint needs an entry"),
      new RewardRuleCheckpointNameLengthRule(32),
      new RewardRuleCheckpointEndsAtRangeRule(80, 120),
      new RewardRuleCheckpointUpdatedAtRangeRule(64, 3600),
    ],
  );
}
