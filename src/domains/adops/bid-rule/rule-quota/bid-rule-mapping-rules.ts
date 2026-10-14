import * as text from "../../../../kit/text.js";
import { BidRuleMapping } from "./bid-rule-mapping.js";

/** A rule a bid rule mapping must pass. Check returns its problems, or none. */
export interface BidRuleMappingRule {
  check(item: BidRuleMapping): string[];
}

export class BidRuleMappingFrequencyCapRangeRule implements BidRuleMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleMapping): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleMappingApprovedGuardRule implements BidRuleMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BidRuleMapping): string[] {
    if (item.approved && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class BidRuleMappingSegmentLengthRule implements BidRuleMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleMapping): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleMappingAllowedCodeRule implements BidRuleMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class BidRuleMappingRequiredTitleRule implements BidRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule mapping. */
export class BidRuleMappingValidator {
  rules: BidRuleMappingRule[];

  constructor(rules: BidRuleMappingRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleMapping): string[] {
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

  requireValid(item: BidRuleMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleMapping[]): Map<string, string[]> {
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

export function defaultBidRuleMappingValidator(): BidRuleMappingValidator {
  return new BidRuleMappingValidator(
    [
      new BidRuleMappingFrequencyCapRangeRule(1000, 3600),
      new BidRuleMappingApprovedGuardRule(1000),
      new BidRuleMappingSegmentLengthRule(80),
      new BidRuleMappingAllowedCodeRule(["weighted", "primary", "manual"]),
      new BidRuleMappingRequiredTitleRule("bid rule mapping needs this field"),
    ],
  );
}
