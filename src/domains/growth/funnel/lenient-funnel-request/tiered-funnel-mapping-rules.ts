import { TieredFunnelMapping } from "./tiered-funnel-mapping.js";

/** A rule a tiered funnel mapping must pass. Check returns its problems, or none. */
export interface TieredFunnelMappingRule {
  check(item: TieredFunnelMapping): string[];
}

export class TieredFunnelMappingRevisionRangeRule implements TieredFunnelMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFunnelMapping): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredFunnelMappingCodePrefixRule implements TieredFunnelMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredFunnelMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredFunnelMappingCohortLengthRule implements TieredFunnelMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFunnelMapping): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered funnel mapping. */
export class TieredFunnelMappingValidator {
  rules: TieredFunnelMappingRule[];

  constructor(rules: TieredFunnelMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFunnelMapping): string[] {
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

  requireValid(item: TieredFunnelMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFunnelMapping[]): Map<string, string[]> {
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

export function defaultTieredFunnelMappingValidator(): TieredFunnelMappingValidator {
  return new TieredFunnelMappingValidator(
    [
      new TieredFunnelMappingRevisionRangeRule(32, 3600),
      new TieredFunnelMappingCodePrefixRule("ACM"),
      new TieredFunnelMappingCohortLengthRule(16),
    ],
  );
}
