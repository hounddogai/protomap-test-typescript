import * as text from "../../../../kit/text.js";
import { ComplaintClaim } from "./complaint-claim.js";

/** A rule a complaint claim must pass. Check returns its problems, or none. */
export interface ComplaintClaimRule {
  check(item: ComplaintClaim): string[];
}

export class ComplaintClaimAllowedCampaignRefRule implements ComplaintClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ComplaintClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is unknown`];
    return [];
  }
}

export class ComplaintClaimDurationMinutesRangeRule implements ComplaintClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintClaim): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintClaimRequiredCampaignRefRule implements ComplaintClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintClaim): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintClaimRequiredPhoneRule implements ComplaintClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintClaim): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintClaimCampaignRefLengthRule implements ComplaintClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintClaim): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintClaimPhoneLengthRule implements ComplaintClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintClaim): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint claim. */
export class ComplaintClaimValidator {
  rules: ComplaintClaimRule[];

  constructor(rules: ComplaintClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintClaim): string[] {
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

  requireValid(item: ComplaintClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintClaim[]): Map<string, string[]> {
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

export function defaultComplaintClaimValidator(): ComplaintClaimValidator {
  return new ComplaintClaimValidator(
    [
      new ComplaintClaimAllowedCampaignRefRule(["seasonal", "lenient", "seasonal"]),
      new ComplaintClaimDurationMinutesRangeRule(80, 120),
      new ComplaintClaimRequiredCampaignRefRule("complaint claim needs this field"),
      new ComplaintClaimRequiredPhoneRule("complaint claim needs a value"),
      new ComplaintClaimCampaignRefLengthRule(120),
      new ComplaintClaimPhoneLengthRule(255),
    ],
  );
}
