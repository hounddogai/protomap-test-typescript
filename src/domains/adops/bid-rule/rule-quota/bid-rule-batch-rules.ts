import * as text from "../../../../kit/text.js";
import { BidRuleBatch } from "./bid-rule-batch.js";

/** A rule a bid rule batch must pass. Check returns its problems, or none. */
export interface BidRuleBatchRule {
  check(item: BidRuleBatch): string[];
}

export class BidRuleBatchNotesLengthRule implements BidRuleBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleBatch): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleBatchFrequencyCapRangeRule implements BidRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleBatch): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleBatchRequiredLabelRule implements BidRuleBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleBatchAllowedNotesRule implements BidRuleBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is unknown`];
    return [];
  }
}

export class BidRuleBatchMarginRangeRule implements BidRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleBatch): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleBatchCodePrefixRule implements BidRuleBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a bid rule batch. */
export class BidRuleBatchValidator {
  rules: BidRuleBatchRule[];

  constructor(rules: BidRuleBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleBatch[]): Map<string, string[]> {
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

export function defaultBidRuleBatchValidator(): BidRuleBatchValidator {
  return new BidRuleBatchValidator(
    [
      new BidRuleBatchNotesLengthRule(64),
      new BidRuleBatchFrequencyCapRangeRule(80, 86400),
      new BidRuleBatchRequiredLabelRule("bid rule batch needs a value"),
      new BidRuleBatchAllowedNotesRule(["default", "regional"]),
      new BidRuleBatchMarginRangeRule(5.6, 2483.7),
      new BidRuleBatchCodePrefixRule("REF"),
    ],
  );
}
