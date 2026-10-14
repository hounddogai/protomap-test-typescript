import { SeasonalProofBundle } from "./seasonal-proof-bundle.js";

/** A rule a seasonal proof bundle must pass. Check returns its problems, or none. */
export interface SeasonalProofBundleRule {
  check(item: SeasonalProofBundle): string[];
}

export class SeasonalProofBundleCodePrefixRule implements SeasonalProofBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalProofBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalProofBundleLabelLengthRule implements SeasonalProofBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalProofBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalProofBundleVisibleGuardRule implements SeasonalProofBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalProofBundle): string[] {
    if (item.visible && item.floorValue > this.limit) return [`floor value ${item.floorValue} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SeasonalProofBundleRequiredChecksumRule implements SeasonalProofBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalProofBundle): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalProofBundleRequiredCountryRule implements SeasonalProofBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalProofBundle): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalProofBundleFloorValueRangeRule implements SeasonalProofBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalProofBundle): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal proof bundle. */
export class SeasonalProofBundleValidator {
  rules: SeasonalProofBundleRule[];

  constructor(rules: SeasonalProofBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalProofBundle): string[] {
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

  requireValid(item: SeasonalProofBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalProofBundle[]): Map<string, string[]> {
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

export function defaultSeasonalProofBundleValidator(): SeasonalProofBundleValidator {
  return new SeasonalProofBundleValidator(
    [
      new SeasonalProofBundleCodePrefixRule("Q"),
      new SeasonalProofBundleLabelLengthRule(32),
      new SeasonalProofBundleVisibleGuardRule(1.6),
      new SeasonalProofBundleRequiredChecksumRule("seasonal proof bundle needs a value"),
      new SeasonalProofBundleRequiredCountryRule("seasonal proof bundle needs an entry"),
      new SeasonalProofBundleFloorValueRangeRule(7, 740.6),
    ],
  );
}
