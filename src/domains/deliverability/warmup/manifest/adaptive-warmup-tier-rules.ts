import { AdaptiveWarmupTier } from "./adaptive-warmup-tier.js";

/** A rule a adaptive warmup tier must pass. Check returns its problems, or none. */
export interface AdaptiveWarmupTierRule {
  check(item: AdaptiveWarmupTier): string[];
}

export class AdaptiveWarmupTierSendAtRangeRule implements AdaptiveWarmupTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveWarmupTier): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveWarmupTierSegmentLengthRule implements AdaptiveWarmupTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWarmupTier): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveWarmupTierCodeLengthRule implements AdaptiveWarmupTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWarmupTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive warmup tier. */
export class AdaptiveWarmupTierValidator {
  rules: AdaptiveWarmupTierRule[];

  constructor(rules: AdaptiveWarmupTierRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveWarmupTier): string[] {
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

  requireValid(item: AdaptiveWarmupTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveWarmupTier[]): Map<string, string[]> {
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

export function defaultAdaptiveWarmupTierValidator(): AdaptiveWarmupTierValidator {
  return new AdaptiveWarmupTierValidator(
    [
      new AdaptiveWarmupTierSendAtRangeRule(64, 80),
      new AdaptiveWarmupTierSegmentLengthRule(80),
      new AdaptiveWarmupTierCodeLengthRule(80),
    ],
  );
}
