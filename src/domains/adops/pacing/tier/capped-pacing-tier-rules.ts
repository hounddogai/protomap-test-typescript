import { CappedPacingTier } from "./capped-pacing-tier.js";

/** A rule a capped pacing tier must pass. Check returns its problems, or none. */
export interface CappedPacingTierRule {
  check(item: CappedPacingTier): string[];
}

export class CappedPacingTierRequiredCodeRule implements CappedPacingTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPacingTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPacingTierBudgetRangeRule implements CappedPacingTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPacingTier): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedPacingTierVisibleGuardRule implements CappedPacingTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedPacingTier): string[] {
    if (item.visible && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CappedPacingTierRegionLengthRule implements CappedPacingTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPacingTier): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPacingTierExternalRefLengthRule implements CappedPacingTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPacingTier): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPacingTierRequiredExternalRefRule implements CappedPacingTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPacingTier): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped pacing tier. */
export class CappedPacingTierValidator {
  rules: CappedPacingTierRule[];

  constructor(rules: CappedPacingTierRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPacingTier): string[] {
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

  requireValid(item: CappedPacingTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPacingTier[]): Map<string, string[]> {
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

export function defaultCappedPacingTierValidator(): CappedPacingTierValidator {
  return new CappedPacingTierValidator(
    [
      new CappedPacingTierRequiredCodeRule("capped pacing tier needs an entry"),
      new CappedPacingTierBudgetRangeRule(1.6, 63.3),
      new CappedPacingTierVisibleGuardRule(86400),
      new CappedPacingTierRegionLengthRule(80),
      new CappedPacingTierExternalRefLengthRule(32),
      new CappedPacingTierRequiredExternalRefRule("capped pacing tier needs a value"),
    ],
  );
}
