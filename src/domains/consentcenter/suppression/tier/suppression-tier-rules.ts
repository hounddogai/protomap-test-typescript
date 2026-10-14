import * as text from "../../../../kit/text.js";
import { SuppressionTier } from "./suppression-tier.js";

/** A rule a suppression tier must pass. Check returns its problems, or none. */
export interface SuppressionTierRule {
  check(item: SuppressionTier): string[];
}

export class SuppressionTierAllowedCodeRule implements SuppressionTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class SuppressionTierImpressionsRangeRule implements SuppressionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionTier): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionTierUpdatedAtRangeRule implements SuppressionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionTier): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionTierRequiredUtmSourceRule implements SuppressionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionTier): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionTierRequiredVariantRule implements SuppressionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionTier): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionTierCodePrefixRule implements SuppressionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a suppression tier. */
export class SuppressionTierValidator {
  rules: SuppressionTierRule[];

  constructor(rules: SuppressionTierRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionTier[]): Map<string, string[]> {
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

export function defaultSuppressionTierValidator(): SuppressionTierValidator {
  return new SuppressionTierValidator(
    [
      new SuppressionTierAllowedCodeRule(["tiered", "adaptive", "scheduled"]),
      new SuppressionTierImpressionsRangeRule(16, 255),
      new SuppressionTierUpdatedAtRangeRule(32, 1000),
      new SuppressionTierRequiredUtmSourceRule("suppression tier needs an entry"),
      new SuppressionTierRequiredVariantRule("suppression tier needs this field"),
      new SuppressionTierCodePrefixRule("OPS"),
    ],
  );
}
