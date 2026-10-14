import { RollingFraudCheckTier } from "./rolling-fraud-check-tier.js";

/** A rule a rolling fraud check tier must pass. Check returns its problems, or none. */
export interface RollingFraudCheckTierRule {
  check(item: RollingFraudCheckTier): string[];
}

export class RollingFraudCheckTierSendAtRangeRule implements RollingFraudCheckTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFraudCheckTier): string[] {
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

export class RollingFraudCheckTierRequiredCodeRule implements RollingFraudCheckTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFraudCheckTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFraudCheckTierScoreRangeRule implements RollingFraudCheckTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFraudCheckTier): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingFraudCheckTierRequiredCountryRule implements RollingFraudCheckTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFraudCheckTier): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFraudCheckTierGraceDaysRangeRule implements RollingFraudCheckTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFraudCheckTier): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling fraud check tier. */
export class RollingFraudCheckTierValidator {
  rules: RollingFraudCheckTierRule[];

  constructor(rules: RollingFraudCheckTierRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFraudCheckTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingFraudCheckTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFraudCheckTier[]): Map<string, string[]> {
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

export function defaultRollingFraudCheckTierValidator(): RollingFraudCheckTierValidator {
  return new RollingFraudCheckTierValidator(
    [
      new RollingFraudCheckTierSendAtRangeRule(16, 1000),
      new RollingFraudCheckTierRequiredCodeRule("rolling fraud check tier needs an entry"),
      new RollingFraudCheckTierScoreRangeRule(6.8, 1551.7),
      new RollingFraudCheckTierRequiredCountryRule("rolling fraud check tier needs a value"),
      new RollingFraudCheckTierGraceDaysRangeRule(16, 32),
    ],
  );
}
