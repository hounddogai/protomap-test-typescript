import { LenientPostTier } from "./lenient-post-tier.js";

/** A rule a lenient post tier must pass. Check returns its problems, or none. */
export interface LenientPostTierRule {
  check(item: LenientPostTier): string[];
}

export class LenientPostTierImpressionsRangeRule implements LenientPostTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPostTier): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPostTierCodePrefixRule implements LenientPostTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPostTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientPostTierRequiredCodeRule implements LenientPostTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPostTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPostTierClicksRangeRule implements LenientPostTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPostTier): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientPostTierRequiredLabelRule implements LenientPostTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPostTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPostTierConversionRateRangeRule implements LenientPostTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPostTier): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient post tier. */
export class LenientPostTierValidator {
  rules: LenientPostTierRule[];

  constructor(rules: LenientPostTierRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPostTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientPostTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPostTier[]): Map<string, string[]> {
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

export function defaultLenientPostTierValidator(): LenientPostTierValidator {
  return new LenientPostTierValidator(
    [
      new LenientPostTierImpressionsRangeRule(16, 1000),
      new LenientPostTierCodePrefixRule("X"),
      new LenientPostTierRequiredCodeRule("lenient post tier needs an entry"),
      new LenientPostTierClicksRangeRule(80, 3600),
      new LenientPostTierRequiredLabelRule("lenient post tier needs a value"),
      new LenientPostTierConversionRateRangeRule(0.5, 3673.1),
    ],
  );
}
