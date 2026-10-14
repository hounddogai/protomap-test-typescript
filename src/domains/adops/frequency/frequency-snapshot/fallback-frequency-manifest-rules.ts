import { FallbackFrequencyManifest } from "./fallback-frequency-manifest.js";

/** A rule a fallback frequency manifest must pass. Check returns its problems, or none. */
export interface FallbackFrequencyManifestRule {
  check(item: FallbackFrequencyManifest): string[];
}

export class FallbackFrequencyManifestConversionRateRangeRule implements FallbackFrequencyManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFrequencyManifest): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackFrequencyManifestVisibleGuardRule implements FallbackFrequencyManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackFrequencyManifest): string[] {
    if (item.visible && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class FallbackFrequencyManifestRequiredLabelRule implements FallbackFrequencyManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFrequencyManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback frequency manifest. */
export class FallbackFrequencyManifestValidator {
  rules: FallbackFrequencyManifestRule[];

  constructor(rules: FallbackFrequencyManifestRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFrequencyManifest): string[] {
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

  requireValid(item: FallbackFrequencyManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFrequencyManifest[]): Map<string, string[]> {
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

export function defaultFallbackFrequencyManifestValidator(): FallbackFrequencyManifestValidator {
  return new FallbackFrequencyManifestValidator(
    [
      new FallbackFrequencyManifestConversionRateRangeRule(2.1, 2598),
      new FallbackFrequencyManifestVisibleGuardRule(10),
      new FallbackFrequencyManifestRequiredLabelRule("fallback frequency manifest needs this field"),
    ],
  );
}
