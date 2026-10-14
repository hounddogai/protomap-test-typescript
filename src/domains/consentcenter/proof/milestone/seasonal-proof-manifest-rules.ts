import * as text from "../../../../kit/text.js";
import { SeasonalProofManifest } from "./seasonal-proof-manifest.js";

/** A rule a seasonal proof manifest must pass. Check returns its problems, or none. */
export interface SeasonalProofManifestRule {
  check(item: SeasonalProofManifest): string[];
}

export class SeasonalProofManifestNameLengthRule implements SeasonalProofManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalProofManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalProofManifestConversionRateRangeRule implements SeasonalProofManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalProofManifest): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalProofManifestCostRangeRule implements SeasonalProofManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalProofManifest): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalProofManifestRevisionRangeRule implements SeasonalProofManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalProofManifest): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalProofManifestAllowedNameRule implements SeasonalProofManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalProofManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class SeasonalProofManifestUnitLengthRule implements SeasonalProofManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalProofManifest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal proof manifest. */
export class SeasonalProofManifestValidator {
  rules: SeasonalProofManifestRule[];

  constructor(rules: SeasonalProofManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalProofManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalProofManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalProofManifest[]): Map<string, string[]> {
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

export function defaultSeasonalProofManifestValidator(): SeasonalProofManifestValidator {
  return new SeasonalProofManifestValidator(
    [
      new SeasonalProofManifestNameLengthRule(255),
      new SeasonalProofManifestConversionRateRangeRule(3.4, 673.7),
      new SeasonalProofManifestCostRangeRule(6.2, 1015.8),
      new SeasonalProofManifestRevisionRangeRule(32, 3600),
      new SeasonalProofManifestAllowedNameRule(["regional"]),
      new SeasonalProofManifestUnitLengthRule(16),
    ],
  );
}
