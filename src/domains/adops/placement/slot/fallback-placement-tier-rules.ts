import * as text from "../../../../kit/text.js";
import { FallbackPlacementTier } from "./fallback-placement-tier.js";

/** A rule a fallback placement tier must pass. Check returns its problems, or none. */
export interface FallbackPlacementTierRule {
  check(item: FallbackPlacementTier): string[];
}

export class FallbackPlacementTierRequiredNameRule implements FallbackPlacementTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPlacementTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPlacementTierAllowedUtmSourceRule implements FallbackPlacementTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPlacementTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is not allowed`];
    return [];
  }
}

export class FallbackPlacementTierCostRangeRule implements FallbackPlacementTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPlacementTier): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback placement tier. */
export class FallbackPlacementTierValidator {
  rules: FallbackPlacementTierRule[];

  constructor(rules: FallbackPlacementTierRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPlacementTier): string[] {
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

  requireValid(item: FallbackPlacementTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPlacementTier[]): Map<string, string[]> {
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

export function defaultFallbackPlacementTierValidator(): FallbackPlacementTierValidator {
  return new FallbackPlacementTierValidator(
    [
      new FallbackPlacementTierRequiredNameRule("fallback placement tier needs this field"),
      new FallbackPlacementTierAllowedUtmSourceRule(["lenient", "lenient"]),
      new FallbackPlacementTierCostRangeRule(7, 3468.8),
    ],
  );
}
