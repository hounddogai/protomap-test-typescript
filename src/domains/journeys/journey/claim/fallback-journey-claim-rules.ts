import * as text from "../../../../kit/text.js";
import { FallbackJourneyClaim } from "./fallback-journey-claim.js";

/** A rule a fallback journey claim must pass. Check returns its problems, or none. */
export interface FallbackJourneyClaimRule {
  check(item: FallbackJourneyClaim): string[];
}

export class FallbackJourneyClaimThresholdRangeRule implements FallbackJourneyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackJourneyClaim): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackJourneyClaimAllowedCodeRule implements FallbackJourneyClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackJourneyClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class FallbackJourneyClaimCountryLengthRule implements FallbackJourneyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackJourneyClaim): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback journey claim. */
export class FallbackJourneyClaimValidator {
  rules: FallbackJourneyClaimRule[];

  constructor(rules: FallbackJourneyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackJourneyClaim): string[] {
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

  requireValid(item: FallbackJourneyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackJourneyClaim[]): Map<string, string[]> {
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

export function defaultFallbackJourneyClaimValidator(): FallbackJourneyClaimValidator {
  return new FallbackJourneyClaimValidator(
    [
      new FallbackJourneyClaimThresholdRangeRule(9.1, 4611.8),
      new FallbackJourneyClaimAllowedCodeRule([]),
      new FallbackJourneyClaimCountryLengthRule(3600),
    ],
  );
}
