import { RewardRuleSegment } from "./reward-rule-segment.js";

/** A rule a reward rule segment must pass. Check returns its problems, or none. */
export interface RewardRuleSegmentRule {
  check(item: RewardRuleSegment): string[];
}

export class RewardRuleSegmentCodePrefixRule implements RewardRuleSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleSegmentRequiredContactEmailRule implements RewardRuleSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleSegment): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleSegmentActiveGuardRule implements RewardRuleSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardRuleSegment): string[] {
    if (item.active && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RewardRuleSegmentRatioRangeRule implements RewardRuleSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleSegment): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleSegmentGraceDaysRangeRule implements RewardRuleSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleSegment): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleSegmentRequiredChannelRule implements RewardRuleSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleSegment): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule segment. */
export class RewardRuleSegmentValidator {
  rules: RewardRuleSegmentRule[];

  constructor(rules: RewardRuleSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleSegment): string[] {
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

  requireValid(item: RewardRuleSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleSegment[]): Map<string, string[]> {
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

export function defaultRewardRuleSegmentValidator(): RewardRuleSegmentValidator {
  return new RewardRuleSegmentValidator(
    [
      new RewardRuleSegmentCodePrefixRule("REF"),
      new RewardRuleSegmentRequiredContactEmailRule("reward rule segment needs an entry"),
      new RewardRuleSegmentActiveGuardRule(16),
      new RewardRuleSegmentRatioRangeRule(4, 1035),
      new RewardRuleSegmentGraceDaysRangeRule(32, 255),
      new RewardRuleSegmentRequiredChannelRule("reward rule segment needs a value"),
    ],
  );
}
