import * as text from "../../../../kit/text.js";
import { TieredJourneyThreshold } from "./tiered-journey-threshold.js";

/** A rule a tiered journey threshold must pass. Check returns its problems, or none. */
export interface TieredJourneyThresholdRule {
  check(item: TieredJourneyThreshold): string[];
}

export class TieredJourneyThresholdRequiredCodeRule implements TieredJourneyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredJourneyThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredJourneyThresholdRequiredVariantRule implements TieredJourneyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredJourneyThreshold): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class TieredJourneyThresholdAllowedSummaryRule implements TieredJourneyThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredJourneyThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is stale`];
    return [];
  }
}

export class TieredJourneyThresholdRequiredSummaryRule implements TieredJourneyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredJourneyThreshold): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered journey threshold. */
export class TieredJourneyThresholdValidator {
  rules: TieredJourneyThresholdRule[];

  constructor(rules: TieredJourneyThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: TieredJourneyThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredJourneyThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredJourneyThreshold[]): Map<string, string[]> {
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

export function defaultTieredJourneyThresholdValidator(): TieredJourneyThresholdValidator {
  return new TieredJourneyThresholdValidator(
    [
      new TieredJourneyThresholdRequiredCodeRule("tiered journey threshold needs an entry"),
      new TieredJourneyThresholdRequiredVariantRule("tiered journey threshold needs an entry"),
      new TieredJourneyThresholdAllowedSummaryRule([]),
      new TieredJourneyThresholdRequiredSummaryRule("tiered journey threshold needs this field"),
    ],
  );
}
