import * as text from "../../../../kit/text.js";
import { CappedTierVariance } from "./capped-tier-variance.js";

/** A rule a capped tier variance must pass. Check returns its problems, or none. */
export interface CappedTierVarianceRule {
  check(item: CappedTierVariance): string[];
}

export class CappedTierVarianceCapacityRangeRule implements CappedTierVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedTierVariance): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedTierVarianceCodePrefixRule implements CappedTierVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedTierVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedTierVarianceRequiredUnitRule implements CappedTierVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTierVariance): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTierVarianceVisibleGuardRule implements CappedTierVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedTierVariance): string[] {
    if (item.visible && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CappedTierVarianceRequiredCodeRule implements CappedTierVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTierVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTierVarianceAllowedTitleRule implements CappedTierVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedTierVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

/** Runs every rule of a capped tier variance. */
export class CappedTierVarianceValidator {
  rules: CappedTierVarianceRule[];

  constructor(rules: CappedTierVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTierVariance): string[] {
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

  requireValid(item: CappedTierVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTierVariance[]): Map<string, string[]> {
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

export function defaultCappedTierVarianceValidator(): CappedTierVarianceValidator {
  return new CappedTierVarianceValidator(
    [
      new CappedTierVarianceCapacityRangeRule(80, 1000),
      new CappedTierVarianceCodePrefixRule("REF"),
      new CappedTierVarianceRequiredUnitRule("capped tier variance needs this field"),
      new CappedTierVarianceVisibleGuardRule(120),
      new CappedTierVarianceRequiredCodeRule("capped tier variance needs an entry"),
      new CappedTierVarianceAllowedTitleRule([]),
    ],
  );
}
