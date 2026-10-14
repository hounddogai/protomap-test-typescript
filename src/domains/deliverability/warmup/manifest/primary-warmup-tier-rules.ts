import { PrimaryWarmupTier } from "./primary-warmup-tier.js";

/** A rule a primary warmup tier must pass. Check returns its problems, or none. */
export interface PrimaryWarmupTierRule {
  check(item: PrimaryWarmupTier): string[];
}

export class PrimaryWarmupTierRequiredChannelRule implements PrimaryWarmupTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWarmupTier): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryWarmupTierBidRangeRule implements PrimaryWarmupTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryWarmupTier): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryWarmupTierRequiredCodeRule implements PrimaryWarmupTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryWarmupTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary warmup tier. */
export class PrimaryWarmupTierValidator {
  rules: PrimaryWarmupTierRule[];

  constructor(rules: PrimaryWarmupTierRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryWarmupTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryWarmupTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryWarmupTier[]): Map<string, string[]> {
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

export function defaultPrimaryWarmupTierValidator(): PrimaryWarmupTierValidator {
  return new PrimaryWarmupTierValidator(
    [
      new PrimaryWarmupTierRequiredChannelRule("primary warmup tier needs a value"),
      new PrimaryWarmupTierBidRangeRule(3.7, 4461.4),
      new PrimaryWarmupTierRequiredCodeRule("primary warmup tier needs this field"),
    ],
  );
}
