import * as text from "../../../../kit/text.js";
import { SeasonalTierMapping } from "./seasonal-tier-mapping.js";

/** A rule a seasonal tier mapping must pass. Check returns its problems, or none. */
export interface SeasonalTierMappingRule {
  check(item: SeasonalTierMapping): string[];
}

export class SeasonalTierMappingRequiredVariantRule implements SeasonalTierMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTierMapping): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalTierMappingThresholdRangeRule implements SeasonalTierMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalTierMapping): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalTierMappingVariantLengthRule implements SeasonalTierMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTierMapping): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTierMappingCodePrefixRule implements SeasonalTierMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalTierMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalTierMappingAllowedCodeRule implements SeasonalTierMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalTierMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a seasonal tier mapping. */
export class SeasonalTierMappingValidator {
  rules: SeasonalTierMappingRule[];

  constructor(rules: SeasonalTierMappingRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalTierMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalTierMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalTierMapping[]): Map<string, string[]> {
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

export function defaultSeasonalTierMappingValidator(): SeasonalTierMappingValidator {
  return new SeasonalTierMappingValidator(
    [
      new SeasonalTierMappingRequiredVariantRule("seasonal tier mapping needs a value"),
      new SeasonalTierMappingThresholdRangeRule(4.2, 1606.7),
      new SeasonalTierMappingVariantLengthRule(32),
      new SeasonalTierMappingCodePrefixRule("ACM"),
      new SeasonalTierMappingAllowedCodeRule(["pending"]),
    ],
  );
}
