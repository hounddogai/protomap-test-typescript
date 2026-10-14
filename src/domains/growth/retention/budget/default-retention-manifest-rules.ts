import * as text from "../../../../kit/text.js";
import { DefaultRetentionManifest } from "./default-retention-manifest.js";

/** A rule a default retention manifest must pass. Check returns its problems, or none. */
export interface DefaultRetentionManifestRule {
  check(item: DefaultRetentionManifest): string[];
}

export class DefaultRetentionManifestVersionRangeRule implements DefaultRetentionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRetentionManifest): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultRetentionManifestCodePrefixRule implements DefaultRetentionManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultRetentionManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultRetentionManifestClicksRangeRule implements DefaultRetentionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRetentionManifest): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultRetentionManifestLabelLengthRule implements DefaultRetentionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultRetentionManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultRetentionManifestAllowedLabelRule implements DefaultRetentionManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultRetentionManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

/** Runs every rule of a default retention manifest. */
export class DefaultRetentionManifestValidatorExtra {
  rules: DefaultRetentionManifestRule[];

  constructor(rules: DefaultRetentionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRetentionManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultRetentionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRetentionManifest[]): Map<string, string[]> {
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

export function defaultDefaultRetentionManifestValidator(): DefaultRetentionManifestValidatorExtra {
  return new DefaultRetentionManifestValidatorExtra(
    [
      new DefaultRetentionManifestVersionRangeRule(16, 80),
      new DefaultRetentionManifestCodePrefixRule("X"),
      new DefaultRetentionManifestClicksRangeRule(255, 1000),
      new DefaultRetentionManifestLabelLengthRule(120),
      new DefaultRetentionManifestAllowedLabelRule(["primary", "pending"]),
    ],
  );
}
