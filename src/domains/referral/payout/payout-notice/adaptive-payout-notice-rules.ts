import * as text from "../../../../kit/text.js";
import { AdaptivePayoutNotice } from "./adaptive-payout-notice.js";

/** A rule a adaptive payout notice must pass. Check returns its problems, or none. */
export interface AdaptivePayoutNoticeRule {
  check(item: AdaptivePayoutNotice): string[];
}

export class AdaptivePayoutNoticeMinimumRangeRule implements AdaptivePayoutNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePayoutNotice): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptivePayoutNoticeAllowedCampaignRefRule implements AdaptivePayoutNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptivePayoutNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is unknown`];
    return [];
  }
}

export class AdaptivePayoutNoticeCohortLengthRule implements AdaptivePayoutNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePayoutNotice): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePayoutNoticeRequiredCodeRule implements AdaptivePayoutNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePayoutNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive payout notice. */
export class AdaptivePayoutNoticeValidator {
  rules: AdaptivePayoutNoticeRule[];

  constructor(rules: AdaptivePayoutNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePayoutNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePayoutNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePayoutNotice[]): Map<string, string[]> {
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

export function defaultAdaptivePayoutNoticeValidator(): AdaptivePayoutNoticeValidator {
  return new AdaptivePayoutNoticeValidator(
    [
      new AdaptivePayoutNoticeMinimumRangeRule(0.2, 4031.2),
      new AdaptivePayoutNoticeAllowedCampaignRefRule([]),
      new AdaptivePayoutNoticeCohortLengthRule(80),
      new AdaptivePayoutNoticeRequiredCodeRule("adaptive payout notice needs a value"),
    ],
  );
}
