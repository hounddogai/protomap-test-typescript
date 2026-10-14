import { PrimaryInsightPlan } from "./primary-insight-plan.js";

/** A rule a primary insight plan must pass. Check returns its problems, or none. */
export interface PrimaryInsightPlanRule {
  check(item: PrimaryInsightPlan): string[];
}

export class PrimaryInsightPlanTitleLengthRule implements PrimaryInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInsightPlanWindowDaysRangeRule implements PrimaryInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInsightPlan): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryInsightPlanCountryLengthRule implements PrimaryInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightPlan): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInsightPlanRequiredTitleRule implements PrimaryInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryInsightPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryInsightPlanChannelLengthRule implements PrimaryInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightPlan): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary insight plan. */
export class PrimaryInsightPlanValidator {
  rules: PrimaryInsightPlanRule[];

  constructor(rules: PrimaryInsightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryInsightPlan): string[] {
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

  requireValid(item: PrimaryInsightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryInsightPlan[]): Map<string, string[]> {
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

export function defaultPrimaryInsightPlanValidator(): PrimaryInsightPlanValidator {
  return new PrimaryInsightPlanValidator(
    [
      new PrimaryInsightPlanTitleLengthRule(255),
      new PrimaryInsightPlanWindowDaysRangeRule(1000, 86400),
      new PrimaryInsightPlanCountryLengthRule(64),
      new PrimaryInsightPlanRequiredTitleRule("primary insight plan needs this field"),
      new PrimaryInsightPlanChannelLengthRule(86400),
    ],
  );
}
