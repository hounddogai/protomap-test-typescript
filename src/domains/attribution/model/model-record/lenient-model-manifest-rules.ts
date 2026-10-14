import * as text from "../../../../kit/text.js";
import { LenientModelManifest } from "./lenient-model-manifest.js";

/** A rule a lenient model manifest must pass. Check returns its problems, or none. */
export interface LenientModelManifestRule {
  check(item: LenientModelManifest): string[];
}

export class LenientModelManifestAllowedCodeRule implements LenientModelManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientModelManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class LenientModelManifestTitleLengthRule implements LenientModelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientModelManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientModelManifestCodePrefixRule implements LenientModelManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientModelManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientModelManifestImpressionsRangeRule implements LenientModelManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientModelManifest): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientModelManifestUpdatedAtRangeRule implements LenientModelManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientModelManifest): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient model manifest. */
export class LenientModelManifestValidator {
  rules: LenientModelManifestRule[];

  constructor(rules: LenientModelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientModelManifest): string[] {
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

  requireValid(item: LenientModelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientModelManifest[]): Map<string, string[]> {
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

export function defaultLenientModelManifestValidator(): LenientModelManifestValidator {
  return new LenientModelManifestValidator(
    [
      new LenientModelManifestAllowedCodeRule(["fallback"]),
      new LenientModelManifestTitleLengthRule(80),
      new LenientModelManifestCodePrefixRule("X"),
      new LenientModelManifestImpressionsRangeRule(32, 64),
      new LenientModelManifestUpdatedAtRangeRule(64, 255),
    ],
  );
}
