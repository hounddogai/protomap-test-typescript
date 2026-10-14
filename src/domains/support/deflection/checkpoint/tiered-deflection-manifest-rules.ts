import { TieredDeflectionManifest } from "./tiered-deflection-manifest.js";

/** A rule a tiered deflection manifest must pass. Check returns its problems, or none. */
export interface TieredDeflectionManifestRule {
  check(item: TieredDeflectionManifest): string[];
}

export class TieredDeflectionManifestRequiredUtmSourceRule implements TieredDeflectionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDeflectionManifest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDeflectionManifestThresholdRangeRule implements TieredDeflectionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDeflectionManifest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredDeflectionManifestTitleLengthRule implements TieredDeflectionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDeflectionManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDeflectionManifestRequiredTitleRule implements TieredDeflectionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDeflectionManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered deflection manifest. */
export class TieredDeflectionManifestValidator {
  rules: TieredDeflectionManifestRule[];

  constructor(rules: TieredDeflectionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDeflectionManifest): string[] {
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

  requireValid(item: TieredDeflectionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDeflectionManifest[]): Map<string, string[]> {
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

export function defaultTieredDeflectionManifestValidator(): TieredDeflectionManifestValidator {
  return new TieredDeflectionManifestValidator(
    [
      new TieredDeflectionManifestRequiredUtmSourceRule("tiered deflection manifest needs this field"),
      new TieredDeflectionManifestThresholdRangeRule(4.7, 4536.8),
      new TieredDeflectionManifestTitleLengthRule(32),
      new TieredDeflectionManifestRequiredTitleRule("tiered deflection manifest needs an entry"),
    ],
  );
}
