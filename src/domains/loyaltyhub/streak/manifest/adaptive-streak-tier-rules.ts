import { AdaptiveStreakTier } from "./adaptive-streak-tier.js";

/** A rule a adaptive streak tier must pass. Check returns its problems, or none. */
export interface AdaptiveStreakTierRule {
  check(item: AdaptiveStreakTier): string[];
}

export class AdaptiveStreakTierRequiredChecksumRule implements AdaptiveStreakTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveStreakTier): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveStreakTierRequiredCodeRule implements AdaptiveStreakTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveStreakTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveStreakTierLabelLengthRule implements AdaptiveStreakTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveStreakTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveStreakTierPriorityRangeRule implements AdaptiveStreakTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveStreakTier): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive streak tier. */
export class AdaptiveStreakTierValidator {
  rules: AdaptiveStreakTierRule[];

  constructor(rules: AdaptiveStreakTierRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveStreakTier): string[] {
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

  requireValid(item: AdaptiveStreakTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveStreakTier[]): Map<string, string[]> {
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

export function defaultAdaptiveStreakTierValidator(): AdaptiveStreakTierValidator {
  return new AdaptiveStreakTierValidator(
    [
      new AdaptiveStreakTierRequiredChecksumRule("adaptive streak tier needs a value"),
      new AdaptiveStreakTierRequiredCodeRule("adaptive streak tier needs an entry"),
      new AdaptiveStreakTierLabelLengthRule(1000),
      new AdaptiveStreakTierPriorityRangeRule(32, 86400),
    ],
  );
}
