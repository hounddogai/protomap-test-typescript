import * as text from "../../../../kit/text.js";
import { SeasonalFlightBundle } from "./seasonal-flight-bundle.js";

/** A rule a seasonal flight bundle must pass. Check returns its problems, or none. */
export interface SeasonalFlightBundleRule {
  check(item: SeasonalFlightBundle): string[];
}

export class SeasonalFlightBundleAllowedCountryRule implements SeasonalFlightBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalFlightBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is not allowed`];
    return [];
  }
}

export class SeasonalFlightBundleChecksumLengthRule implements SeasonalFlightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFlightBundle): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalFlightBundleCodePrefixRule implements SeasonalFlightBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalFlightBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalFlightBundleRequiredCodeRule implements SeasonalFlightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFlightBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFlightBundleLimitRangeRule implements SeasonalFlightBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFlightBundle): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalFlightBundleCodeLengthRule implements SeasonalFlightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFlightBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal flight bundle. */
export class SeasonalFlightBundleValidator {
  rules: SeasonalFlightBundleRule[];

  constructor(rules: SeasonalFlightBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFlightBundle): string[] {
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

  requireValid(item: SeasonalFlightBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFlightBundle[]): Map<string, string[]> {
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

export function defaultSeasonalFlightBundleValidator(): SeasonalFlightBundleValidator {
  return new SeasonalFlightBundleValidator(
    [
      new SeasonalFlightBundleAllowedCountryRule(["pending"]),
      new SeasonalFlightBundleChecksumLengthRule(1000),
      new SeasonalFlightBundleCodePrefixRule("REF"),
      new SeasonalFlightBundleRequiredCodeRule("seasonal flight bundle needs a value"),
      new SeasonalFlightBundleLimitRangeRule(32, 64),
      new SeasonalFlightBundleCodeLengthRule(80),
    ],
  );
}
