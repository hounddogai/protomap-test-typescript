import * as text from "../../../../kit/text.js";
import { RegionalSenderPolicy } from "./regional-sender-policy.js";

/** A rule a regional sender policy must pass. Check returns its problems, or none. */
export interface RegionalSenderPolicyRule {
  check(item: RegionalSenderPolicy): string[];
}

export class RegionalSenderPolicyRetriesRangeRule implements RegionalSenderPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderPolicy): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSenderPolicySequenceRangeRule implements RegionalSenderPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderPolicy): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSenderPolicyRatioRangeRule implements RegionalSenderPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderPolicy): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSenderPolicyLabelLengthRule implements RegionalSenderPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSenderPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSenderPolicyPinnedGuardRule implements RegionalSenderPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalSenderPolicy): string[] {
    if (item.pinned && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RegionalSenderPolicyAllowedLabelRule implements RegionalSenderPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSenderPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

/** Runs every rule of a regional sender policy. */
export class RegionalSenderPolicyValidator {
  rules: RegionalSenderPolicyRule[];

  constructor(rules: RegionalSenderPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSenderPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalSenderPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSenderPolicy[]): Map<string, string[]> {
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

export function defaultRegionalSenderPolicyValidator(): RegionalSenderPolicyValidator {
  return new RegionalSenderPolicyValidator(
    [
      new RegionalSenderPolicyRetriesRangeRule(80, 255),
      new RegionalSenderPolicySequenceRangeRule(80, 80),
      new RegionalSenderPolicyRatioRangeRule(7.2, 3389.6),
      new RegionalSenderPolicyLabelLengthRule(86400),
      new RegionalSenderPolicyPinnedGuardRule(86400),
      new RegionalSenderPolicyAllowedLabelRule(["primary"]),
    ],
  );
}
