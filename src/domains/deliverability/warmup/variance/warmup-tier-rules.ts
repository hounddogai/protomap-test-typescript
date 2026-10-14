import { WarmupTier } from "./warmup-tier.js";

/** A rule a warmup tier must pass. Check returns its problems, or none. */
export interface WarmupTierRule {
  check(item: WarmupTier): string[];
}

export class WarmupTierCodeLengthRule implements WarmupTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupTierCapacityRangeRule implements WarmupTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupTier): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupTierMinimumRangeRule implements WarmupTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupTier): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupTierRequiredCodeRule implements WarmupTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupTierStartsAtRangeRule implements WarmupTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupTier): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a warmup tier. */
export class WarmupTierValidator {
  rules: WarmupTierRule[];

  constructor(rules: WarmupTierRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupTier[]): Map<string, string[]> {
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

export function defaultWarmupTierValidator(): WarmupTierValidator {
  return new WarmupTierValidator(
    [
      new WarmupTierCodeLengthRule(120),
      new WarmupTierCapacityRangeRule(1000, 86400),
      new WarmupTierMinimumRangeRule(1, 2047.4),
      new WarmupTierRequiredCodeRule("warmup tier needs this field"),
      new WarmupTierStartsAtRangeRule(16, 32),
    ],
  );
}
