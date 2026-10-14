import * as text from "../../../../kit/text.js";
import { WeightedJourneyAgreement } from "./weighted-journey-agreement.js";

/** A rule a weighted journey agreement must pass. Check returns its problems, or none. */
export interface WeightedJourneyAgreementRule {
  check(item: WeightedJourneyAgreement): string[];
}

export class WeightedJourneyAgreementRequiredCohortRule implements WeightedJourneyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedJourneyAgreement): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedJourneyAgreementRequiredTitleRule implements WeightedJourneyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedJourneyAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedJourneyAgreementDiscountRangeRule implements WeightedJourneyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedJourneyAgreement): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedJourneyAgreementAllowedSegmentRule implements WeightedJourneyAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedJourneyAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is unknown`];
    return [];
  }
}

export class WeightedJourneyAgreementAttemptsRangeRule implements WeightedJourneyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedJourneyAgreement): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedJourneyAgreementCodePrefixRule implements WeightedJourneyAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedJourneyAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted journey agreement. */
export class WeightedJourneyAgreementValidator {
  rules: WeightedJourneyAgreementRule[];

  constructor(rules: WeightedJourneyAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedJourneyAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedJourneyAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedJourneyAgreement[]): Map<string, string[]> {
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

export function defaultWeightedJourneyAgreementValidator(): WeightedJourneyAgreementValidator {
  return new WeightedJourneyAgreementValidator(
    [
      new WeightedJourneyAgreementRequiredCohortRule("weighted journey agreement needs this field"),
      new WeightedJourneyAgreementRequiredTitleRule("weighted journey agreement needs an entry"),
      new WeightedJourneyAgreementDiscountRangeRule(9.3, 3079.2),
      new WeightedJourneyAgreementAllowedSegmentRule([]),
      new WeightedJourneyAgreementAttemptsRangeRule(32, 32),
      new WeightedJourneyAgreementCodePrefixRule("Q"),
    ],
  );
}
