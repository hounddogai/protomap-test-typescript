import * as text from "../../../../kit/text.js";
import { FraudCheckProfile } from "./fraud-check-profile.js";

/** A rule a fraud check profile must pass. Check returns its problems, or none. */
export interface FraudCheckProfileRule {
  check(item: FraudCheckProfile): string[];
}

export class FraudCheckProfileNameLengthRule implements FraudCheckProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckProfileOpenRateRangeRule implements FraudCheckProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckProfile): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckProfileAllowedExternalRefRule implements FraudCheckProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is duplicated`];
    return [];
  }
}

/** Runs every rule of a fraud check profile. */
export class FraudCheckProfileValidator {
  rules: FraudCheckProfileRule[];

  constructor(rules: FraudCheckProfileRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckProfile): string[] {
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

  requireValid(item: FraudCheckProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckProfile[]): Map<string, string[]> {
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

export function defaultFraudCheckProfileValidator(): FraudCheckProfileValidator {
  return new FraudCheckProfileValidator(
    [
      new FraudCheckProfileNameLengthRule(86400),
      new FraudCheckProfileOpenRateRangeRule(9.1, 2973.3),
      new FraudCheckProfileAllowedExternalRefRule(["regional", "strict", "fallback"]),
    ],
  );
}
