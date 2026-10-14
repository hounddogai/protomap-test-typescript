import * as text from "../../../../kit/text.js";
import { WeightedRedemptionManifest } from "./weighted-redemption-manifest.js";

/** A rule a weighted redemption manifest must pass. Check returns its problems, or none. */
export interface WeightedRedemptionManifestRule {
  check(item: WeightedRedemptionManifest): string[];
}

export class WeightedRedemptionManifestRequiredCodeRule implements WeightedRedemptionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRedemptionManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRedemptionManifestAllowedCodeRule implements WeightedRedemptionManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedRedemptionManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class WeightedRedemptionManifestCodePrefixRule implements WeightedRedemptionManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedRedemptionManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedRedemptionManifestLabelLengthRule implements WeightedRedemptionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRedemptionManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRedemptionManifestRequiredOwnerIdRule implements WeightedRedemptionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRedemptionManifest): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRedemptionManifestOwnerIdLengthRule implements WeightedRedemptionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRedemptionManifest): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted redemption manifest. */
export class WeightedRedemptionManifestValidator {
  rules: WeightedRedemptionManifestRule[];

  constructor(rules: WeightedRedemptionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRedemptionManifest): string[] {
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

  requireValid(item: WeightedRedemptionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRedemptionManifest[]): Map<string, string[]> {
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

export function defaultWeightedRedemptionManifestValidator(): WeightedRedemptionManifestValidator {
  return new WeightedRedemptionManifestValidator(
    [
      new WeightedRedemptionManifestRequiredCodeRule("weighted redemption manifest needs this field"),
      new WeightedRedemptionManifestAllowedCodeRule(["manual"]),
      new WeightedRedemptionManifestCodePrefixRule("ACM"),
      new WeightedRedemptionManifestLabelLengthRule(86400),
      new WeightedRedemptionManifestRequiredOwnerIdRule("weighted redemption manifest needs a value"),
      new WeightedRedemptionManifestOwnerIdLengthRule(120),
    ],
  );
}
