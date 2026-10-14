import * as text from "../../../../kit/text.js";
import { RegionalSuppressionProfile } from "./regional-suppression-profile.js";

/** A rule a regional suppression profile must pass. Check returns its problems, or none. */
export interface RegionalSuppressionProfileRule {
  check(item: RegionalSuppressionProfile): string[];
}

export class RegionalSuppressionProfileBidRangeRule implements RegionalSuppressionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSuppressionProfile): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSuppressionProfileAllowedLabelRule implements RegionalSuppressionProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSuppressionProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class RegionalSuppressionProfileRequiredReviewerRule implements RegionalSuppressionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSuppressionProfile): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSuppressionProfileEndsAtRangeRule implements RegionalSuppressionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSuppressionProfile): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional suppression profile. */
export class RegionalSuppressionProfileValidator {
  rules: RegionalSuppressionProfileRule[];

  constructor(rules: RegionalSuppressionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSuppressionProfile): string[] {
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

  requireValid(item: RegionalSuppressionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSuppressionProfile[]): Map<string, string[]> {
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

export function defaultRegionalSuppressionProfileValidator(): RegionalSuppressionProfileValidator {
  return new RegionalSuppressionProfileValidator(
    [
      new RegionalSuppressionProfileBidRangeRule(3.5, 3809.9),
      new RegionalSuppressionProfileAllowedLabelRule(["fallback"]),
      new RegionalSuppressionProfileRequiredReviewerRule("regional suppression profile needs an entry"),
      new RegionalSuppressionProfileEndsAtRangeRule(16, 86400),
    ],
  );
}
