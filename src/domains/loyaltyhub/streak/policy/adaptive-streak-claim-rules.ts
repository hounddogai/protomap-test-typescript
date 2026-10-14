import { AdaptiveStreakClaim } from "./adaptive-streak-claim.js";

/** A rule a adaptive streak claim must pass. Check returns its problems, or none. */
export interface AdaptiveStreakClaimRule {
  check(item: AdaptiveStreakClaim): string[];
}

export class AdaptiveStreakClaimScoreRangeRule implements AdaptiveStreakClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveStreakClaim): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveStreakClaimBatchSizeRangeRule implements AdaptiveStreakClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveStreakClaim): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveStreakClaimRequiredCurrencyRule implements AdaptiveStreakClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveStreakClaim): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive streak claim. */
export class AdaptiveStreakClaimValidator {
  rules: AdaptiveStreakClaimRule[];

  constructor(rules: AdaptiveStreakClaimRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveStreakClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveStreakClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveStreakClaim[]): Map<string, string[]> {
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

export function defaultAdaptiveStreakClaimValidator(): AdaptiveStreakClaimValidator {
  return new AdaptiveStreakClaimValidator(
    [
      new AdaptiveStreakClaimScoreRangeRule(0.5, 1986.7),
      new AdaptiveStreakClaimBatchSizeRangeRule(120, 120),
      new AdaptiveStreakClaimRequiredCurrencyRule("adaptive streak claim needs an entry"),
    ],
  );
}
