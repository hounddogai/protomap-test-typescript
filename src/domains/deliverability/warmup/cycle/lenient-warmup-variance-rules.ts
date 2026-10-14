import * as text from "../../../../kit/text.js";
import { LenientWarmupVariance } from "./lenient-warmup-variance.js";

/** A rule a lenient warmup variance must pass. Check returns its problems, or none. */
export interface LenientWarmupVarianceRule {
  check(item: LenientWarmupVariance): string[];
}

export class LenientWarmupVarianceAttemptsRangeRule implements LenientWarmupVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWarmupVariance): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientWarmupVarianceAllowedJourneyIdRule implements LenientWarmupVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientWarmupVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is below minimum`];
    return [];
  }
}

export class LenientWarmupVarianceConversionRateRangeRule implements LenientWarmupVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWarmupVariance): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientWarmupVarianceRequiredNameRule implements LenientWarmupVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient warmup variance. */
export class LenientWarmupVarianceValidator {
  rules: LenientWarmupVarianceRule[];

  constructor(rules: LenientWarmupVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWarmupVariance): string[] {
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

  requireValid(item: LenientWarmupVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWarmupVariance[]): Map<string, string[]> {
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

export function defaultLenientWarmupVarianceValidator(): LenientWarmupVarianceValidator {
  return new LenientWarmupVarianceValidator(
    [
      new LenientWarmupVarianceAttemptsRangeRule(32, 64),
      new LenientWarmupVarianceAllowedJourneyIdRule([]),
      new LenientWarmupVarianceConversionRateRangeRule(5.3, 1471.5),
      new LenientWarmupVarianceRequiredNameRule("lenient warmup variance needs an entry"),
    ],
  );
}
