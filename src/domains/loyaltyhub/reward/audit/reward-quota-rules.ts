import { RewardQuota } from "./reward-quota.js";

/** A rule a reward quota must pass. Check returns its problems, or none. */
export interface RewardQuotaRule {
  check(item: RewardQuota): string[];
}

export class RewardQuotaSendAtRangeRule implements RewardQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardQuota): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardQuotaRequiredChannelRule implements RewardQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardQuota): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RewardQuotaLabelLengthRule implements RewardQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardQuotaRequiredLabelRule implements RewardQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardQuotaChannelLengthRule implements RewardQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardQuota): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward quota. */
export class RewardQuotaValidator {
  rules: RewardQuotaRule[];

  constructor(rules: RewardQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RewardQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardQuota[]): Map<string, string[]> {
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

export function defaultRewardQuotaValidator(): RewardQuotaValidator {
  return new RewardQuotaValidator(
    [
      new RewardQuotaSendAtRangeRule(16, 80),
      new RewardQuotaRequiredChannelRule("reward quota needs an entry"),
      new RewardQuotaLabelLengthRule(16),
      new RewardQuotaRequiredLabelRule("reward quota needs a value"),
      new RewardQuotaChannelLengthRule(255),
    ],
  );
}
