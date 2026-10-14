import * as text from "../../../../kit/text.js";
import { SeasonalCsatPolicy } from "./seasonal-csat-policy.js";

/** A rule a seasonal csat policy must pass. Check returns its problems, or none. */
export interface SeasonalCsatPolicyRule {
  check(item: SeasonalCsatPolicy): string[];
}

export class SeasonalCsatPolicyRequiredNameRule implements SeasonalCsatPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCsatPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCsatPolicyRequiredChannelRule implements SeasonalCsatPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCsatPolicy): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCsatPolicyAllowedReviewerRule implements SeasonalCsatPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalCsatPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is duplicated`];
    return [];
  }
}

export class SeasonalCsatPolicyThresholdRangeRule implements SeasonalCsatPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCsatPolicy): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalCsatPolicyNameLengthRule implements SeasonalCsatPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCsatPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal csat policy. */
export class SeasonalCsatPolicyValidator {
  rules: SeasonalCsatPolicyRule[];

  constructor(rules: SeasonalCsatPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCsatPolicy): string[] {
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

  requireValid(item: SeasonalCsatPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCsatPolicy[]): Map<string, string[]> {
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

export function defaultSeasonalCsatPolicyValidator(): SeasonalCsatPolicyValidator {
  return new SeasonalCsatPolicyValidator(
    [
      new SeasonalCsatPolicyRequiredNameRule("seasonal csat policy needs an entry"),
      new SeasonalCsatPolicyRequiredChannelRule("seasonal csat policy needs a value"),
      new SeasonalCsatPolicyAllowedReviewerRule([]),
      new SeasonalCsatPolicyThresholdRangeRule(5.9, 3188.1),
      new SeasonalCsatPolicyNameLengthRule(16),
    ],
  );
}
