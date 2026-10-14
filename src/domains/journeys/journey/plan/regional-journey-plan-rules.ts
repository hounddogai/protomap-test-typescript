import * as text from "../../../../kit/text.js";
import { RegionalJourneyPlan } from "./regional-journey-plan.js";

/** A rule a regional journey plan must pass. Check returns its problems, or none. */
export interface RegionalJourneyPlanRule {
  check(item: RegionalJourneyPlan): string[];
}

export class RegionalJourneyPlanCodeLengthRule implements RegionalJourneyPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalJourneyPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalJourneyPlanClicksRangeRule implements RegionalJourneyPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalJourneyPlan): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalJourneyPlanAllowedCountryRule implements RegionalJourneyPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalJourneyPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is above maximum`];
    return [];
  }
}

/** Runs every rule of a regional journey plan. */
export class RegionalJourneyPlanValidator {
  rules: RegionalJourneyPlanRule[];

  constructor(rules: RegionalJourneyPlanRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalJourneyPlan): string[] {
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

  requireValid(item: RegionalJourneyPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalJourneyPlan[]): Map<string, string[]> {
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

export function defaultRegionalJourneyPlanValidator(): RegionalJourneyPlanValidator {
  return new RegionalJourneyPlanValidator(
    [
      new RegionalJourneyPlanCodeLengthRule(16),
      new RegionalJourneyPlanClicksRangeRule(16, 86400),
      new RegionalJourneyPlanAllowedCountryRule(["seasonal", "strict", "fallback"]),
    ],
  );
}
