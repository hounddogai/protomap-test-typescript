import * as text from "../../../../kit/text.js";
import { WeightedPreferenceMapping } from "./weighted-preference-mapping.js";

/** A rule a weighted preference mapping must pass. Check returns its problems, or none. */
export interface WeightedPreferenceMappingRule {
  check(item: WeightedPreferenceMapping): string[];
}

export class WeightedPreferenceMappingRequiredLocaleRule implements WeightedPreferenceMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferenceMapping): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferenceMappingCodePrefixRule implements WeightedPreferenceMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedPreferenceMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedPreferenceMappingPinnedGuardRule implements WeightedPreferenceMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedPreferenceMapping): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class WeightedPreferenceMappingCostRangeRule implements WeightedPreferenceMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPreferenceMapping): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPreferenceMappingAllowedCodeRule implements WeightedPreferenceMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPreferenceMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class WeightedPreferenceMappingCodeLengthRule implements WeightedPreferenceMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPreferenceMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted preference mapping. */
export class WeightedPreferenceMappingValidator {
  rules: WeightedPreferenceMappingRule[];

  constructor(rules: WeightedPreferenceMappingRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPreferenceMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPreferenceMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPreferenceMapping[]): Map<string, string[]> {
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

export function defaultWeightedPreferenceMappingValidator(): WeightedPreferenceMappingValidator {
  return new WeightedPreferenceMappingValidator(
    [
      new WeightedPreferenceMappingRequiredLocaleRule("weighted preference mapping needs this field"),
      new WeightedPreferenceMappingCodePrefixRule("X"),
      new WeightedPreferenceMappingPinnedGuardRule(64),
      new WeightedPreferenceMappingCostRangeRule(4.3, 295),
      new WeightedPreferenceMappingAllowedCodeRule(["global", "primary", "seasonal"]),
      new WeightedPreferenceMappingCodeLengthRule(86400),
    ],
  );
}
