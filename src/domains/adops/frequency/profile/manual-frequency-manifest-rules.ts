import * as text from "../../../../kit/text.js";
import { ManualFrequencyManifest } from "./manual-frequency-manifest.js";

/** A rule a manual frequency manifest must pass. Check returns its problems, or none. */
export interface ManualFrequencyManifestRule {
  check(item: ManualFrequencyManifest): string[];
}

export class ManualFrequencyManifestRequiredLabelRule implements ManualFrequencyManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFrequencyManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFrequencyManifestRequiredCodeRule implements ManualFrequencyManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFrequencyManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFrequencyManifestAllowedLabelRule implements ManualFrequencyManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualFrequencyManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a manual frequency manifest. */
export class ManualFrequencyManifestValidator {
  rules: ManualFrequencyManifestRule[];

  constructor(rules: ManualFrequencyManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFrequencyManifest): string[] {
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

  requireValid(item: ManualFrequencyManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFrequencyManifest[]): Map<string, string[]> {
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

export function defaultManualFrequencyManifestValidator(): ManualFrequencyManifestValidator {
  return new ManualFrequencyManifestValidator(
    [
      new ManualFrequencyManifestRequiredLabelRule("manual frequency manifest needs this field"),
      new ManualFrequencyManifestRequiredCodeRule("manual frequency manifest needs an entry"),
      new ManualFrequencyManifestAllowedLabelRule(["capped", "tiered", "legacy"]),
    ],
  );
}
