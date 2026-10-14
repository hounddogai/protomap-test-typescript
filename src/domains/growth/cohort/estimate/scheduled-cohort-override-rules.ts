import * as text from "../../../../kit/text.js";
import { ScheduledCohortOverride } from "./scheduled-cohort-override.js";

/** A rule a scheduled cohort override must pass. Check returns its problems, or none. */
export interface ScheduledCohortOverrideRule {
  check(item: ScheduledCohortOverride): string[];
}

export class ScheduledCohortOverrideCampaignRefLengthRule implements ScheduledCohortOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCohortOverride): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCohortOverrideAllowedLocaleRule implements ScheduledCohortOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledCohortOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

export class ScheduledCohortOverrideSequenceRangeRule implements ScheduledCohortOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCohortOverride): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledCohortOverrideRequiredCampaignRefRule implements ScheduledCohortOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCohortOverride): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCohortOverrideSummaryLengthRule implements ScheduledCohortOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCohortOverride): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCohortOverrideAmountRangeRule implements ScheduledCohortOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCohortOverride): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled cohort override. */
export class ScheduledCohortOverrideValidator {
  rules: ScheduledCohortOverrideRule[];

  constructor(rules: ScheduledCohortOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCohortOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCohortOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCohortOverride[]): Map<string, string[]> {
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

export function defaultScheduledCohortOverrideValidator(): ScheduledCohortOverrideValidator {
  return new ScheduledCohortOverrideValidator(
    [
      new ScheduledCohortOverrideCampaignRefLengthRule(1000),
      new ScheduledCohortOverrideAllowedLocaleRule(["capped", "manual"]),
      new ScheduledCohortOverrideSequenceRangeRule(16, 3600),
      new ScheduledCohortOverrideRequiredCampaignRefRule("scheduled cohort override needs this field"),
      new ScheduledCohortOverrideSummaryLengthRule(86400),
      new ScheduledCohortOverrideAmountRangeRule(9.5, 779.4),
    ],
  );
}
