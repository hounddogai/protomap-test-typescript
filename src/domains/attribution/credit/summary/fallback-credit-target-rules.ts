import * as text from "../../../../kit/text.js";
import { FallbackCreditTarget } from "./fallback-credit-target.js";

/** A rule a fallback credit target must pass. Check returns its problems, or none. */
export interface FallbackCreditTargetRule {
  check(item: FallbackCreditTarget): string[];
}

export class FallbackCreditTargetAllowedJourneyIdRule implements FallbackCreditTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackCreditTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is missing`];
    return [];
  }
}

export class FallbackCreditTargetRateRangeRule implements FallbackCreditTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreditTarget): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackCreditTargetRequiredCohortRule implements FallbackCreditTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditTarget): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditTargetRequiredCampaignRefRule implements FallbackCreditTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditTarget): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback credit target. */
export class FallbackCreditTargetValidator {
  rules: FallbackCreditTargetRule[];

  constructor(rules: FallbackCreditTargetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreditTarget): string[] {
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

  requireValid(item: FallbackCreditTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreditTarget[]): Map<string, string[]> {
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

export function defaultFallbackCreditTargetValidator(): FallbackCreditTargetValidator {
  return new FallbackCreditTargetValidator(
    [
      new FallbackCreditTargetAllowedJourneyIdRule([]),
      new FallbackCreditTargetRateRangeRule(6.6, 1249.4),
      new FallbackCreditTargetRequiredCohortRule("fallback credit target needs this field"),
      new FallbackCreditTargetRequiredCampaignRefRule("fallback credit target needs an entry"),
    ],
  );
}
