import * as text from "../../../../kit/text.js";
import { FallbackWarmupManifest } from "./fallback-warmup-manifest.js";

/** A rule a fallback warmup manifest must pass. Check returns its problems, or none. */
export interface FallbackWarmupManifestRule {
  check(item: FallbackWarmupManifest): string[];
}

export class FallbackWarmupManifestAllowedCodeRule implements FallbackWarmupManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackWarmupManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class FallbackWarmupManifestUnitLengthRule implements FallbackWarmupManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackWarmupManifest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackWarmupManifestRequiredCodeRule implements FallbackWarmupManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWarmupManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWarmupManifestOpenRateRangeRule implements FallbackWarmupManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackWarmupManifest): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback warmup manifest. */
export class FallbackWarmupManifestValidator {
  rules: FallbackWarmupManifestRule[];

  constructor(rules: FallbackWarmupManifestRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackWarmupManifest): string[] {
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

  requireValid(item: FallbackWarmupManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackWarmupManifest[]): Map<string, string[]> {
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

export function defaultFallbackWarmupManifestValidator(): FallbackWarmupManifestValidator {
  return new FallbackWarmupManifestValidator(
    [
      new FallbackWarmupManifestAllowedCodeRule([]),
      new FallbackWarmupManifestUnitLengthRule(3600),
      new FallbackWarmupManifestRequiredCodeRule("fallback warmup manifest needs a value"),
      new FallbackWarmupManifestOpenRateRangeRule(5.5, 4094.1),
    ],
  );
}
