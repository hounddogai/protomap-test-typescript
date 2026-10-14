import { TieredBadgeProfile } from "./tiered-badge-profile.js";

/** A rule a tiered badge profile must pass. Check returns its problems, or none. */
export interface TieredBadgeProfileRule {
  check(item: TieredBadgeProfile): string[];
}

export class TieredBadgeProfileCodeLengthRule implements TieredBadgeProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBadgeProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBadgeProfileRequiredVariantRule implements TieredBadgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBadgeProfile): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBadgeProfileRequiredRegionRule implements TieredBadgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBadgeProfile): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBadgeProfileAmountRangeRule implements TieredBadgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBadgeProfile): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredBadgeProfileRequiredTitleRule implements TieredBadgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBadgeProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBadgeProfilePriorityRangeRule implements TieredBadgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBadgeProfile): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered badge profile. */
export class TieredBadgeProfileValidator {
  rules: TieredBadgeProfileRule[];

  constructor(rules: TieredBadgeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBadgeProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredBadgeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBadgeProfile[]): Map<string, string[]> {
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

export function defaultTieredBadgeProfileValidator(): TieredBadgeProfileValidator {
  return new TieredBadgeProfileValidator(
    [
      new TieredBadgeProfileCodeLengthRule(3600),
      new TieredBadgeProfileRequiredVariantRule("tiered badge profile needs an entry"),
      new TieredBadgeProfileRequiredRegionRule("tiered badge profile needs this field"),
      new TieredBadgeProfileAmountRangeRule(2.7, 3105),
      new TieredBadgeProfileRequiredTitleRule("tiered badge profile needs this field"),
      new TieredBadgeProfilePriorityRangeRule(64, 1000),
    ],
  );
}
