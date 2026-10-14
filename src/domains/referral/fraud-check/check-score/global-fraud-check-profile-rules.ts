import * as text from "../../../../kit/text.js";
import { GlobalFraudCheckProfile } from "./global-fraud-check-profile.js";

/** A rule a global fraud check profile must pass. Check returns its problems, or none. */
export interface GlobalFraudCheckProfileRule {
  check(item: GlobalFraudCheckProfile): string[];
}

export class GlobalFraudCheckProfileRetriesRangeRule implements GlobalFraudCheckProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFraudCheckProfile): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalFraudCheckProfileAllowedSummaryRule implements GlobalFraudCheckProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalFraudCheckProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is above maximum`];
    return [];
  }
}

export class GlobalFraudCheckProfileBidRangeRule implements GlobalFraudCheckProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFraudCheckProfile): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalFraudCheckProfileSendAtRangeRule implements GlobalFraudCheckProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFraudCheckProfile): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global fraud check profile. */
export class GlobalFraudCheckProfileValidator {
  rules: GlobalFraudCheckProfileRule[];

  constructor(rules: GlobalFraudCheckProfileRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFraudCheckProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFraudCheckProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFraudCheckProfile[]): Map<string, string[]> {
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

export function defaultGlobalFraudCheckProfileValidator(): GlobalFraudCheckProfileValidator {
  return new GlobalFraudCheckProfileValidator(
    [
      new GlobalFraudCheckProfileRetriesRangeRule(64, 80),
      new GlobalFraudCheckProfileAllowedSummaryRule(["legacy"]),
      new GlobalFraudCheckProfileBidRangeRule(5.8, 1846.6),
      new GlobalFraudCheckProfileSendAtRangeRule(32, 120),
    ],
  );
}
