import { TieredFlightManifest } from "./tiered-flight-manifest.js";

/** A rule a tiered flight manifest must pass. Check returns its problems, or none. */
export interface TieredFlightManifestRule {
  check(item: TieredFlightManifest): string[];
}

export class TieredFlightManifestRequiredCodeRule implements TieredFlightManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFlightManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFlightManifestLabelLengthRule implements TieredFlightManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFlightManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFlightManifestCountryLengthRule implements TieredFlightManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFlightManifest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFlightManifestFloorValueRangeRule implements TieredFlightManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFlightManifest): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered flight manifest. */
export class TieredFlightManifestValidator {
  rules: TieredFlightManifestRule[];

  constructor(rules: TieredFlightManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFlightManifest): string[] {
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

  requireValid(item: TieredFlightManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFlightManifest[]): Map<string, string[]> {
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

export function defaultTieredFlightManifestValidator(): TieredFlightManifestValidator {
  return new TieredFlightManifestValidator(
    [
      new TieredFlightManifestRequiredCodeRule("tiered flight manifest needs this field"),
      new TieredFlightManifestLabelLengthRule(32),
      new TieredFlightManifestCountryLengthRule(32),
      new TieredFlightManifestFloorValueRangeRule(7.6, 484.7),
    ],
  );
}
