import { TieredWarmupTier } from "./tiered-warmup-tier.js";

/** A rule a tiered warmup tier must pass. Check returns its problems, or none. */
export interface TieredWarmupTierRule {
  check(item: TieredWarmupTier): string[];
}

export class TieredWarmupTierSendAtRangeRule implements TieredWarmupTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWarmupTier): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredWarmupTierChannelLengthRule implements TieredWarmupTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWarmupTier): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWarmupTierRequiredChannelRule implements TieredWarmupTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWarmupTier): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWarmupTierRequiredTitleRule implements TieredWarmupTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWarmupTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWarmupTierRequiredCodeRule implements TieredWarmupTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWarmupTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWarmupTierCodePrefixRule implements TieredWarmupTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredWarmupTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered warmup tier. */
export class TieredWarmupTierValidator {
  rules: TieredWarmupTierRule[];

  constructor(rules: TieredWarmupTierRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWarmupTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredWarmupTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWarmupTier[]): Map<string, string[]> {
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

export function defaultTieredWarmupTierValidator(): TieredWarmupTierValidator {
  return new TieredWarmupTierValidator(
    [
      new TieredWarmupTierSendAtRangeRule(80, 86400),
      new TieredWarmupTierChannelLengthRule(3600),
      new TieredWarmupTierRequiredChannelRule("tiered warmup tier needs this field"),
      new TieredWarmupTierRequiredTitleRule("tiered warmup tier needs this field"),
      new TieredWarmupTierRequiredCodeRule("tiered warmup tier needs a value"),
      new TieredWarmupTierCodePrefixRule("X"),
    ],
  );
}
