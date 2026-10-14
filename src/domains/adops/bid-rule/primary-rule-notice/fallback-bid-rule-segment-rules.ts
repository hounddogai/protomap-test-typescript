import * as text from "../../../../kit/text.js";
import { FallbackBidRuleSegment } from "./fallback-bid-rule-segment.js";

/** A rule a fallback bid rule segment must pass. Check returns its problems, or none. */
export interface FallbackBidRuleSegmentRule {
  check(item: FallbackBidRuleSegment): string[];
}

export class FallbackBidRuleSegmentRetriesRangeRule implements FallbackBidRuleSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBidRuleSegment): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackBidRuleSegmentCodePrefixRule implements FallbackBidRuleSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackBidRuleSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackBidRuleSegmentExternalRefLengthRule implements FallbackBidRuleSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRuleSegment): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBidRuleSegmentRequiredReviewerRule implements FallbackBidRuleSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBidRuleSegment): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBidRuleSegmentPriorityRangeRule implements FallbackBidRuleSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBidRuleSegment): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackBidRuleSegmentAllowedCodeRule implements FallbackBidRuleSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackBidRuleSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a fallback bid rule segment. */
export class FallbackBidRuleSegmentValidator {
  rules: FallbackBidRuleSegmentRule[];

  constructor(rules: FallbackBidRuleSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBidRuleSegment): string[] {
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

  requireValid(item: FallbackBidRuleSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBidRuleSegment[]): Map<string, string[]> {
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

export function defaultFallbackBidRuleSegmentValidator(): FallbackBidRuleSegmentValidator {
  return new FallbackBidRuleSegmentValidator(
    [
      new FallbackBidRuleSegmentRetriesRangeRule(32, 120),
      new FallbackBidRuleSegmentCodePrefixRule("Q"),
      new FallbackBidRuleSegmentExternalRefLengthRule(3600),
      new FallbackBidRuleSegmentRequiredReviewerRule("fallback bid rule segment needs an entry"),
      new FallbackBidRuleSegmentPriorityRangeRule(32, 120),
      new FallbackBidRuleSegmentAllowedCodeRule(["primary", "lenient"]),
    ],
  );
}
