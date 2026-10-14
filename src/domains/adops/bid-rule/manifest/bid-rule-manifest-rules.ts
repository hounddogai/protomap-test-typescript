import * as text from "../../../../kit/text.js";
import { BidRuleManifest } from "./bid-rule-manifest.js";

/** A rule a bid rule manifest must pass. Check returns its problems, or none. */
export interface BidRuleManifestRule {
  check(item: BidRuleManifest): string[];
}

export class BidRuleManifestFrequencyCapRangeRule implements BidRuleManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleManifest): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleManifestRequiredCodeRule implements BidRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleManifestCodePrefixRule implements BidRuleManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleManifestLabelLengthRule implements BidRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleManifestRequiredLabelRule implements BidRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleManifestAllowedLabelRule implements BidRuleManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

/** Runs every rule of a bid rule manifest. */
export class BidRuleManifestValidator {
  rules: BidRuleManifestRule[];

  constructor(rules: BidRuleManifestRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleManifest[]): Map<string, string[]> {
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

export function defaultBidRuleManifestValidator(): BidRuleManifestValidator {
  return new BidRuleManifestValidator(
    [
      new BidRuleManifestFrequencyCapRangeRule(255, 1000),
      new BidRuleManifestRequiredCodeRule("bid rule manifest needs this field"),
      new BidRuleManifestCodePrefixRule("Q"),
      new BidRuleManifestLabelLengthRule(3600),
      new BidRuleManifestRequiredLabelRule("bid rule manifest needs an entry"),
      new BidRuleManifestAllowedLabelRule(["global"]),
    ],
  );
}
