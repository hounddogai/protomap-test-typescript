import * as text from "../../../../kit/text.js";
import { WeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

/** A rule a weighted reward rule summary must pass. Check returns its problems, or none. */
export interface WeightedRewardRuleSummaryRule {
  check(item: WeightedRewardRuleSummary): string[];
}

export class WeightedRewardRuleSummaryCodeLengthRule implements WeightedRewardRuleSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRuleSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardRuleSummaryClicksRangeRule implements WeightedRewardRuleSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardRuleSummary): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedRewardRuleSummaryRequiredUnitRule implements WeightedRewardRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardRuleSummary): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardRuleSummaryRequiredCodeRule implements WeightedRewardRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardRuleSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardRuleSummaryAllowedJourneyIdRule implements WeightedRewardRuleSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedRewardRuleSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is above maximum`];
    return [];
  }
}

export class WeightedRewardRuleSummaryChannelLengthRule implements WeightedRewardRuleSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRuleSummary): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted reward rule summary. */
export class WeightedRewardRuleSummaryValidator {
  rules: WeightedRewardRuleSummaryRule[];

  constructor(rules: WeightedRewardRuleSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardRuleSummary): string[] {
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

  requireValid(item: WeightedRewardRuleSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardRuleSummary[]): Map<string, string[]> {
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

export function defaultWeightedRewardRuleSummaryValidator(): WeightedRewardRuleSummaryValidator {
  return new WeightedRewardRuleSummaryValidator(
    [
      new WeightedRewardRuleSummaryCodeLengthRule(1000),
      new WeightedRewardRuleSummaryClicksRangeRule(64, 120),
      new WeightedRewardRuleSummaryRequiredUnitRule("weighted reward rule summary needs a value"),
      new WeightedRewardRuleSummaryRequiredCodeRule("weighted reward rule summary needs this field"),
      new WeightedRewardRuleSummaryAllowedJourneyIdRule(["tiered", "capped"]),
      new WeightedRewardRuleSummaryChannelLengthRule(64),
    ],
  );
}
