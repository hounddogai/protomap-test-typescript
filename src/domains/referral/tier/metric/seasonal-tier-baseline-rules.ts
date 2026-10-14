import { SeasonalTierBaseline } from "./seasonal-tier-baseline.js";

/** A rule a seasonal tier baseline must pass. Check returns its problems, or none. */
export interface SeasonalTierBaselineRule {
  check(item: SeasonalTierBaseline): string[];
}

export class SeasonalTierBaselineCodePrefixRule implements SeasonalTierBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalTierBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalTierBaselineCodeLengthRule implements SeasonalTierBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTierBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTierBaselineFloorValueRangeRule implements SeasonalTierBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalTierBaseline): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalTierBaselineExpiresAtRangeRule implements SeasonalTierBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalTierBaseline): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalTierBaselineRequiredCodeRule implements SeasonalTierBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTierBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal tier baseline. */
export class SeasonalTierBaselineValidator {
  rules: SeasonalTierBaselineRule[];

  constructor(rules: SeasonalTierBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalTierBaseline): string[] {
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

  requireValid(item: SeasonalTierBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalTierBaseline[]): Map<string, string[]> {
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

export function defaultSeasonalTierBaselineValidator(): SeasonalTierBaselineValidator {
  return new SeasonalTierBaselineValidator(
    [
      new SeasonalTierBaselineCodePrefixRule("Q"),
      new SeasonalTierBaselineCodeLengthRule(1000),
      new SeasonalTierBaselineFloorValueRangeRule(0.2, 2718.8),
      new SeasonalTierBaselineExpiresAtRangeRule(16, 255),
      new SeasonalTierBaselineRequiredCodeRule("seasonal tier baseline needs a value"),
    ],
  );
}
