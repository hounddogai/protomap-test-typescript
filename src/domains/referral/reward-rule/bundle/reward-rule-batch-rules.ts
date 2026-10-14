import { RewardRuleBatch } from "./reward-rule-batch.js";

/** A rule a reward rule batch must pass. Check returns its problems, or none. */
export interface RewardRuleBatchRule {
  check(item: RewardRuleBatch): string[];
}

export class RewardRuleBatchRequiredCodeRule implements RewardRuleBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleBatchFrequencyCapRangeRule implements RewardRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleBatch): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleBatchUtmSourceLengthRule implements RewardRuleBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleBatch): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleBatchCodePrefixRule implements RewardRuleBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleBatchCeilingRangeRule implements RewardRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleBatch): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward rule batch. */
export class RewardRuleBatchValidator {
  rules: RewardRuleBatchRule[];

  constructor(rules: RewardRuleBatchRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleBatch): string[] {
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

  requireValid(item: RewardRuleBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleBatch[]): Map<string, string[]> {
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

export function defaultRewardRuleBatchValidator(): RewardRuleBatchValidator {
  return new RewardRuleBatchValidator(
    [
      new RewardRuleBatchRequiredCodeRule("reward rule batch needs an entry"),
      new RewardRuleBatchFrequencyCapRangeRule(64, 255),
      new RewardRuleBatchUtmSourceLengthRule(3600),
      new RewardRuleBatchCodePrefixRule("OPS"),
      new RewardRuleBatchCeilingRangeRule(9.7, 246.8),
    ],
  );
}
