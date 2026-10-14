import * as text from "../../../../kit/text.js";
import { TieredSubscriptionScore } from "./tiered-subscription-score.js";

/** A rule a tiered subscription score must pass. Check returns its problems, or none. */
export interface TieredSubscriptionScoreRule {
  check(item: TieredSubscriptionScore): string[];
}

export class TieredSubscriptionScoreRequiredCodeRule implements TieredSubscriptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSubscriptionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSubscriptionScoreJourneyIdLengthRule implements TieredSubscriptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSubscriptionScore): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredSubscriptionScoreAllowedDescriptionRule implements TieredSubscriptionScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredSubscriptionScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is missing`];
    return [];
  }
}

export class TieredSubscriptionScoreRatioRangeRule implements TieredSubscriptionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSubscriptionScore): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredSubscriptionScoreChecksumLengthRule implements TieredSubscriptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSubscriptionScore): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered subscription score. */
export class TieredSubscriptionScoreValidator {
  rules: TieredSubscriptionScoreRule[];

  constructor(rules: TieredSubscriptionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSubscriptionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredSubscriptionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSubscriptionScore[]): Map<string, string[]> {
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

export function defaultTieredSubscriptionScoreValidator(): TieredSubscriptionScoreValidator {
  return new TieredSubscriptionScoreValidator(
    [
      new TieredSubscriptionScoreRequiredCodeRule("tiered subscription score needs a value"),
      new TieredSubscriptionScoreJourneyIdLengthRule(32),
      new TieredSubscriptionScoreAllowedDescriptionRule([]),
      new TieredSubscriptionScoreRatioRangeRule(0.8, 2126.5),
      new TieredSubscriptionScoreChecksumLengthRule(16),
    ],
  );
}
