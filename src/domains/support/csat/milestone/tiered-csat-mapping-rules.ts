import { TieredCsatMapping } from "./tiered-csat-mapping.js";

/** A rule a tiered csat mapping must pass. Check returns its problems, or none. */
export interface TieredCsatMappingRule {
  check(item: TieredCsatMapping): string[];
}

export class TieredCsatMappingUpdatedAtRangeRule implements TieredCsatMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCsatMapping): string[] {
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

export class TieredCsatMappingExternalRefLengthRule implements TieredCsatMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCsatMapping): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCsatMappingRequiredLabelRule implements TieredCsatMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCsatMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCsatMappingTitleLengthRule implements TieredCsatMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCsatMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCsatMappingCodePrefixRule implements TieredCsatMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredCsatMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredCsatMappingLabelLengthRule implements TieredCsatMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCsatMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered csat mapping. */
export class TieredCsatMappingValidator {
  rules: TieredCsatMappingRule[];

  constructor(rules: TieredCsatMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCsatMapping): string[] {
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

  requireValid(item: TieredCsatMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCsatMapping[]): Map<string, string[]> {
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

export function defaultTieredCsatMappingValidator(): TieredCsatMappingValidator {
  return new TieredCsatMappingValidator(
    [
      new TieredCsatMappingUpdatedAtRangeRule(32, 1000),
      new TieredCsatMappingExternalRefLengthRule(64),
      new TieredCsatMappingRequiredLabelRule("tiered csat mapping needs this field"),
      new TieredCsatMappingTitleLengthRule(120),
      new TieredCsatMappingCodePrefixRule("Q"),
      new TieredCsatMappingLabelLengthRule(64),
    ],
  );
}
