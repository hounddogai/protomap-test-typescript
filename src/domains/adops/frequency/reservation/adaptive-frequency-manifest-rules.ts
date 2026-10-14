import * as text from "../../../../kit/text.js";
import { AdaptiveFrequencyManifest } from "./adaptive-frequency-manifest.js";

/** A rule a adaptive frequency manifest must pass. Check returns its problems, or none. */
export interface AdaptiveFrequencyManifestRule {
  check(item: AdaptiveFrequencyManifest): string[];
}

export class AdaptiveFrequencyManifestCreatedAtRangeRule implements AdaptiveFrequencyManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFrequencyManifest): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFrequencyManifestApprovedGuardRule implements AdaptiveFrequencyManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveFrequencyManifest): string[] {
    if (item.approved && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class AdaptiveFrequencyManifestCodeLengthRule implements AdaptiveFrequencyManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFrequencyManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFrequencyManifestAllowedLabelRule implements AdaptiveFrequencyManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveFrequencyManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class AdaptiveFrequencyManifestRequiredCodeRule implements AdaptiveFrequencyManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFrequencyManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive frequency manifest. */
export class AdaptiveFrequencyManifestValidator {
  rules: AdaptiveFrequencyManifestRule[];

  constructor(rules: AdaptiveFrequencyManifestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFrequencyManifest): string[] {
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

  requireValid(item: AdaptiveFrequencyManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFrequencyManifest[]): Map<string, string[]> {
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

export function defaultAdaptiveFrequencyManifestValidator(): AdaptiveFrequencyManifestValidator {
  return new AdaptiveFrequencyManifestValidator(
    [
      new AdaptiveFrequencyManifestCreatedAtRangeRule(64, 1000),
      new AdaptiveFrequencyManifestApprovedGuardRule(4.5),
      new AdaptiveFrequencyManifestCodeLengthRule(255),
      new AdaptiveFrequencyManifestAllowedLabelRule(["scheduled"]),
      new AdaptiveFrequencyManifestRequiredCodeRule("adaptive frequency manifest needs this field"),
    ],
  );
}
