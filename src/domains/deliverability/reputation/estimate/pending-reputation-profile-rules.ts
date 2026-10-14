import * as text from "../../../../kit/text.js";
import { PendingReputationProfile } from "./pending-reputation-profile.js";

/** A rule a pending reputation profile must pass. Check returns its problems, or none. */
export interface PendingReputationProfileRule {
  check(item: PendingReputationProfile): string[];
}

export class PendingReputationProfileRequiredTitleRule implements PendingReputationProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReputationProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReputationProfileTitleLengthRule implements PendingReputationProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingReputationProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingReputationProfileRequiredCodeRule implements PendingReputationProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingReputationProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingReputationProfileSequenceRangeRule implements PendingReputationProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingReputationProfile): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingReputationProfileAllowedCodeRule implements PendingReputationProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingReputationProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class PendingReputationProfileCodeLengthRule implements PendingReputationProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingReputationProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending reputation profile. */
export class PendingReputationProfileValidator {
  rules: PendingReputationProfileRule[];

  constructor(rules: PendingReputationProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PendingReputationProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingReputationProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingReputationProfile[]): Map<string, string[]> {
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

export function defaultPendingReputationProfileValidator(): PendingReputationProfileValidator {
  return new PendingReputationProfileValidator(
    [
      new PendingReputationProfileRequiredTitleRule("pending reputation profile needs an entry"),
      new PendingReputationProfileTitleLengthRule(32),
      new PendingReputationProfileRequiredCodeRule("pending reputation profile needs a value"),
      new PendingReputationProfileSequenceRangeRule(16, 32),
      new PendingReputationProfileAllowedCodeRule(["fallback", "adaptive"]),
      new PendingReputationProfileCodeLengthRule(16),
    ],
  );
}
