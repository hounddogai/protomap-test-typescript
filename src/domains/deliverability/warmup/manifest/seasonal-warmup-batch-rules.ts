import { SeasonalWarmupBatch } from "./seasonal-warmup-batch.js";

/** A rule a seasonal warmup batch must pass. Check returns its problems, or none. */
export interface SeasonalWarmupBatchRule {
  check(item: SeasonalWarmupBatch): string[];
}

export class SeasonalWarmupBatchBidRangeRule implements SeasonalWarmupBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWarmupBatch): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalWarmupBatchChannelLengthRule implements SeasonalWarmupBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWarmupBatch): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWarmupBatchRequiredTitleRule implements SeasonalWarmupBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal warmup batch. */
export class SeasonalWarmupBatchValidator {
  rules: SeasonalWarmupBatchRule[];

  constructor(rules: SeasonalWarmupBatchRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWarmupBatch): string[] {
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

  requireValid(item: SeasonalWarmupBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWarmupBatch[]): Map<string, string[]> {
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

export function defaultSeasonalWarmupBatchValidator(): SeasonalWarmupBatchValidator {
  return new SeasonalWarmupBatchValidator(
    [
      new SeasonalWarmupBatchBidRangeRule(3.8, 2731.6),
      new SeasonalWarmupBatchChannelLengthRule(86400),
      new SeasonalWarmupBatchRequiredTitleRule("seasonal warmup batch needs this field"),
    ],
  );
}
