import { TierMapping } from "./tier-mapping.js";

/** A rule a tier mapping must pass. Check returns its problems, or none. */
export interface TierMappingRule {
  check(item: TierMapping): string[];
}

export class TierMappingContactEmailLengthRule implements TierMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierMapping): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierMappingCodeLengthRule implements TierMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierMappingBidRangeRule implements TierMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierMapping): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tier mapping. */
export class TierMappingValidator {
  rules: TierMappingRule[];

  constructor(rules: TierMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TierMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierMapping[]): Map<string, string[]> {
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

export function defaultTierMappingValidator(): TierMappingValidator {
  return new TierMappingValidator(
    [
      new TierMappingContactEmailLengthRule(1000),
      new TierMappingCodeLengthRule(120),
      new TierMappingBidRangeRule(4.2, 4022.8),
    ],
  );
}
