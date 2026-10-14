import { SeasonalPostOverride } from "./seasonal-post-override.js";

/** A rule a seasonal post override must pass. Check returns its problems, or none. */
export interface SeasonalPostOverrideRule {
  check(item: SeasonalPostOverride): string[];
}

export class SeasonalPostOverrideConversionRateRangeRule implements SeasonalPostOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPostOverride): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalPostOverrideRegionLengthRule implements SeasonalPostOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPostOverride): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPostOverrideAmountRangeRule implements SeasonalPostOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPostOverride): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalPostOverrideRequiredRegionRule implements SeasonalPostOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPostOverride): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal post override. */
export class SeasonalPostOverrideValidator {
  rules: SeasonalPostOverrideRule[];

  constructor(rules: SeasonalPostOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPostOverride): string[] {
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

  requireValid(item: SeasonalPostOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPostOverride[]): Map<string, string[]> {
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

export function defaultSeasonalPostOverrideValidator(): SeasonalPostOverrideValidator {
  return new SeasonalPostOverrideValidator(
    [
      new SeasonalPostOverrideConversionRateRangeRule(7, 1822.7),
      new SeasonalPostOverrideRegionLengthRule(86400),
      new SeasonalPostOverrideAmountRangeRule(7.6, 2922.1),
      new SeasonalPostOverrideRequiredRegionRule("seasonal post override needs a value"),
    ],
  );
}
