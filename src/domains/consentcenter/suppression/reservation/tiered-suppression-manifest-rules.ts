import * as text from "../../../../kit/text.js";
import { TieredSuppressionManifest } from "./tiered-suppression-manifest.js";

/** A rule a tiered suppression manifest must pass. Check returns its problems, or none. */
export interface TieredSuppressionManifestRule {
  check(item: TieredSuppressionManifest): string[];
}

export class TieredSuppressionManifestTitleLengthRule implements TieredSuppressionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSuppressionManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredSuppressionManifestAllowedDescriptionRule implements TieredSuppressionManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredSuppressionManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is too long`];
    return [];
  }
}

export class TieredSuppressionManifestRequiredNameRule implements TieredSuppressionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSuppressionManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered suppression manifest. */
export class TieredSuppressionManifestValidator {
  rules: TieredSuppressionManifestRule[];

  constructor(rules: TieredSuppressionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSuppressionManifest): string[] {
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

  requireValid(item: TieredSuppressionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSuppressionManifest[]): Map<string, string[]> {
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

export function defaultTieredSuppressionManifestValidator(): TieredSuppressionManifestValidator {
  return new TieredSuppressionManifestValidator(
    [
      new TieredSuppressionManifestTitleLengthRule(86400),
      new TieredSuppressionManifestAllowedDescriptionRule([]),
      new TieredSuppressionManifestRequiredNameRule("tiered suppression manifest needs a value"),
    ],
  );
}
