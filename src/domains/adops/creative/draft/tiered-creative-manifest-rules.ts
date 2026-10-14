import { TieredCreativeManifest } from "./tiered-creative-manifest.js";

/** A rule a tiered creative manifest must pass. Check returns its problems, or none. */
export interface TieredCreativeManifestRule {
  check(item: TieredCreativeManifest): string[];
}

export class TieredCreativeManifestContactEmailLengthRule implements TieredCreativeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCreativeManifest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCreativeManifestMaximumRangeRule implements TieredCreativeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCreativeManifest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredCreativeManifestWindowDaysRangeRule implements TieredCreativeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCreativeManifest): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredCreativeManifestRequiredContactEmailRule implements TieredCreativeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCreativeManifest): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered creative manifest. */
export class TieredCreativeManifestValidator {
  rules: TieredCreativeManifestRule[];

  constructor(rules: TieredCreativeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCreativeManifest): string[] {
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

  requireValid(item: TieredCreativeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCreativeManifest[]): Map<string, string[]> {
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

export function defaultTieredCreativeManifestValidator(): TieredCreativeManifestValidator {
  return new TieredCreativeManifestValidator(
    [
      new TieredCreativeManifestContactEmailLengthRule(16),
      new TieredCreativeManifestMaximumRangeRule(3.6, 3366.3),
      new TieredCreativeManifestWindowDaysRangeRule(32, 3600),
      new TieredCreativeManifestRequiredContactEmailRule("tiered creative manifest needs a value"),
    ],
  );
}
