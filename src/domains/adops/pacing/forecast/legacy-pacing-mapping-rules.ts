import * as text from "../../../../kit/text.js";
import { LegacyPacingMapping } from "./legacy-pacing-mapping.js";

/** A rule a legacy pacing mapping must pass. Check returns its problems, or none. */
export interface LegacyPacingMappingRule {
  check(item: LegacyPacingMapping): string[];
}

export class LegacyPacingMappingConversionRateRangeRule implements LegacyPacingMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPacingMapping): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyPacingMappingTitleLengthRule implements LegacyPacingMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPacingMappingVariantLengthRule implements LegacyPacingMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingMapping): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPacingMappingAllowedCodeRule implements LegacyPacingMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyPacingMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

/** Runs every rule of a legacy pacing mapping. */
export class LegacyPacingMappingValidator {
  rules: LegacyPacingMappingRule[];

  constructor(rules: LegacyPacingMappingRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPacingMapping): string[] {
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

  requireValid(item: LegacyPacingMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPacingMapping[]): Map<string, string[]> {
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

export function defaultLegacyPacingMappingValidator(): LegacyPacingMappingValidator {
  return new LegacyPacingMappingValidator(
    [
      new LegacyPacingMappingConversionRateRangeRule(9.3, 2603.5),
      new LegacyPacingMappingTitleLengthRule(86400),
      new LegacyPacingMappingVariantLengthRule(80),
      new LegacyPacingMappingAllowedCodeRule(["tiered", "seasonal", "tiered"]),
    ],
  );
}
