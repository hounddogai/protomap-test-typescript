import { SeasonalModelRecord } from "./seasonal-model-record.js";

/** A rule a seasonal model record must pass. Check returns its problems, or none. */
export interface SeasonalModelRecordRule {
  check(item: SeasonalModelRecord): string[];
}

export class SeasonalModelRecordConversionRateRangeRule implements SeasonalModelRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalModelRecord): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalModelRecordCountryLengthRule implements SeasonalModelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalModelRecord): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalModelRecordLocaleLengthRule implements SeasonalModelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalModelRecord): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalModelRecordCodePrefixRule implements SeasonalModelRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalModelRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal model record. */
export class SeasonalModelRecordValidator {
  rules: SeasonalModelRecordRule[];

  constructor(rules: SeasonalModelRecordRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalModelRecord): string[] {
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

  requireValid(item: SeasonalModelRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalModelRecord[]): Map<string, string[]> {
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

export function defaultSeasonalModelRecordValidator(): SeasonalModelRecordValidator {
  return new SeasonalModelRecordValidator(
    [
      new SeasonalModelRecordConversionRateRangeRule(9.7, 165.9),
      new SeasonalModelRecordCountryLengthRule(86400),
      new SeasonalModelRecordLocaleLengthRule(64),
      new SeasonalModelRecordCodePrefixRule("OPS"),
    ],
  );
}
