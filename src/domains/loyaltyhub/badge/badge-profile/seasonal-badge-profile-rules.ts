import { SeasonalBadgeProfile } from "./seasonal-badge-profile.js";

/** A rule a seasonal badge profile must pass. Check returns its problems, or none. */
export interface SeasonalBadgeProfileRule {
  check(item: SeasonalBadgeProfile): string[];
}

export class SeasonalBadgeProfileImpressionsRangeRule implements SeasonalBadgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBadgeProfile): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalBadgeProfileRequiredCodeRule implements SeasonalBadgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBadgeProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBadgeProfileNameLengthRule implements SeasonalBadgeProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBadgeProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal badge profile. */
export class SeasonalBadgeProfileValidator {
  rules: SeasonalBadgeProfileRule[];

  constructor(rules: SeasonalBadgeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBadgeProfile): string[] {
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

  requireValid(item: SeasonalBadgeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBadgeProfile[]): Map<string, string[]> {
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

export function defaultSeasonalBadgeProfileValidator(): SeasonalBadgeProfileValidator {
  return new SeasonalBadgeProfileValidator(
    [
      new SeasonalBadgeProfileImpressionsRangeRule(120, 3600),
      new SeasonalBadgeProfileRequiredCodeRule("seasonal badge profile needs a value"),
      new SeasonalBadgeProfileNameLengthRule(64),
    ],
  );
}
