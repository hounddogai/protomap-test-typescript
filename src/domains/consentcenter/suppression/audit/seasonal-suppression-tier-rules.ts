import { SeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

/** A rule a seasonal suppression tier must pass. Check returns its problems, or none. */
export interface SeasonalSuppressionTierRule {
  check(item: SeasonalSuppressionTier): string[];
}

export class SeasonalSuppressionTierLocaleLengthRule implements SeasonalSuppressionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSuppressionTier): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSuppressionTierWindowDaysRangeRule implements SeasonalSuppressionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSuppressionTier): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalSuppressionTierRequiredCodeRule implements SeasonalSuppressionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSuppressionTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSuppressionTierCodePrefixRule implements SeasonalSuppressionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalSuppressionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalSuppressionTierRequiredTitleRule implements SeasonalSuppressionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSuppressionTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSuppressionTierRequiredContactEmailRule implements SeasonalSuppressionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSuppressionTier): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal suppression tier. */
export class SeasonalSuppressionTierValidator {
  rules: SeasonalSuppressionTierRule[];

  constructor(rules: SeasonalSuppressionTierRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSuppressionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalSuppressionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSuppressionTier[]): Map<string, string[]> {
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

export function defaultSeasonalSuppressionTierValidator(): SeasonalSuppressionTierValidator {
  return new SeasonalSuppressionTierValidator(
    [
      new SeasonalSuppressionTierLocaleLengthRule(16),
      new SeasonalSuppressionTierWindowDaysRangeRule(64, 120),
      new SeasonalSuppressionTierRequiredCodeRule("seasonal suppression tier needs an entry"),
      new SeasonalSuppressionTierCodePrefixRule("Q"),
      new SeasonalSuppressionTierRequiredTitleRule("seasonal suppression tier needs an entry"),
      new SeasonalSuppressionTierRequiredContactEmailRule("seasonal suppression tier needs this field"),
    ],
  );
}
