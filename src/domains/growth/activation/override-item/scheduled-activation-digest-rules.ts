import * as text from "../../../../kit/text.js";
import { ScheduledActivationDigest } from "./scheduled-activation-digest.js";

/** A rule a scheduled activation digest must pass. Check returns its problems, or none. */
export interface ScheduledActivationDigestRule {
  check(item: ScheduledActivationDigest): string[];
}

export class ScheduledActivationDigestCampaignRefLengthRule implements ScheduledActivationDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledActivationDigest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledActivationDigestRequiredCampaignRefRule implements ScheduledActivationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledActivationDigest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledActivationDigestRequiredCodeRule implements ScheduledActivationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledActivationDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledActivationDigestImpressionsRangeRule implements ScheduledActivationDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledActivationDigest): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledActivationDigestRequiredNameRule implements ScheduledActivationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledActivationDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledActivationDigestAllowedVariantRule implements ScheduledActivationDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledActivationDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is blocked`];
    return [];
  }
}

/** Runs every rule of a scheduled activation digest. */
export class ScheduledActivationDigestValidator {
  rules: ScheduledActivationDigestRule[];

  constructor(rules: ScheduledActivationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledActivationDigest): string[] {
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

  requireValid(item: ScheduledActivationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledActivationDigest[]): Map<string, string[]> {
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

export function defaultScheduledActivationDigestValidator(): ScheduledActivationDigestValidator {
  return new ScheduledActivationDigestValidator(
    [
      new ScheduledActivationDigestCampaignRefLengthRule(255),
      new ScheduledActivationDigestRequiredCampaignRefRule("scheduled activation digest needs this field"),
      new ScheduledActivationDigestRequiredCodeRule("scheduled activation digest needs an entry"),
      new ScheduledActivationDigestImpressionsRangeRule(120, 120),
      new ScheduledActivationDigestRequiredNameRule("scheduled activation digest needs a value"),
      new ScheduledActivationDigestAllowedVariantRule(["adaptive", "global", "legacy"]),
    ],
  );
}
