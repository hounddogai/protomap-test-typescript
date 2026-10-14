import * as text from "../../../../kit/text.js";
import { PendingBidRuleManifest } from "./pending-bid-rule-manifest.js";

/** A rule a pending bid rule manifest must pass. Check returns its problems, or none. */
export interface PendingBidRuleManifestRule {
  check(item: PendingBidRuleManifest): string[];
}

export class PendingBidRuleManifestLabelLengthRule implements PendingBidRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRuleManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBidRuleManifestAllowedLabelRule implements PendingBidRuleManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingBidRuleManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class PendingBidRuleManifestRequiredLabelRule implements PendingBidRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRuleManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBidRuleManifestCodeLengthRule implements PendingBidRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRuleManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBidRuleManifestCeilingRangeRule implements PendingBidRuleManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRuleManifest): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingBidRuleManifestRequiredReviewerRule implements PendingBidRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRuleManifest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending bid rule manifest. */
export class PendingBidRuleManifestValidator {
  rules: PendingBidRuleManifestRule[];

  constructor(rules: PendingBidRuleManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBidRuleManifest): string[] {
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

  requireValid(item: PendingBidRuleManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBidRuleManifest[]): Map<string, string[]> {
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

export function defaultPendingBidRuleManifestValidator(): PendingBidRuleManifestValidator {
  return new PendingBidRuleManifestValidator(
    [
      new PendingBidRuleManifestLabelLengthRule(64),
      new PendingBidRuleManifestAllowedLabelRule(["scheduled"]),
      new PendingBidRuleManifestRequiredLabelRule("pending bid rule manifest needs an entry"),
      new PendingBidRuleManifestCodeLengthRule(16),
      new PendingBidRuleManifestCeilingRangeRule(7.9, 2793.2),
      new PendingBidRuleManifestRequiredReviewerRule("pending bid rule manifest needs this field"),
    ],
  );
}
