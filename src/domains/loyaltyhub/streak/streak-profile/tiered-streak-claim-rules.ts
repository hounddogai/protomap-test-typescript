import { TieredStreakClaim } from "./tiered-streak-claim.js";

/** A rule a tiered streak claim must pass. Check returns its problems, or none. */
export interface TieredStreakClaimRule {
  check(item: TieredStreakClaim): string[];
}

export class TieredStreakClaimUtmSourceLengthRule implements TieredStreakClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredStreakClaim): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredStreakClaimOwnerIdLengthRule implements TieredStreakClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredStreakClaim): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredStreakClaimConversionRateRangeRule implements TieredStreakClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredStreakClaim): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredStreakClaimRequiredUtmSourceRule implements TieredStreakClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredStreakClaim): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered streak claim. */
export class TieredStreakClaimValidator {
  rules: TieredStreakClaimRule[];

  constructor(rules: TieredStreakClaimRule[]) {
    this.rules = rules;
  }

  validate(item: TieredStreakClaim): string[] {
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

  requireValid(item: TieredStreakClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredStreakClaim[]): Map<string, string[]> {
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

export function defaultTieredStreakClaimValidator(): TieredStreakClaimValidator {
  return new TieredStreakClaimValidator(
    [
      new TieredStreakClaimUtmSourceLengthRule(3600),
      new TieredStreakClaimOwnerIdLengthRule(64),
      new TieredStreakClaimConversionRateRangeRule(8.6, 826.4),
      new TieredStreakClaimRequiredUtmSourceRule("tiered streak claim needs this field"),
    ],
  );
}
