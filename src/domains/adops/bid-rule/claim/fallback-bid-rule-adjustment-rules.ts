import * as text from "../../../../kit/text.js";
import { FallbackBidRuleAdjustment } from "./fallback-bid-rule-adjustment.js";

/** A rule a fallback bid rule adjustment must pass. Check returns its problems, or none. */
export interface FallbackBidRuleAdjustmentRule {
  check(item: FallbackBidRuleAdjustment): string[];
}

export class FallbackBidRuleAdjustmentRequiredSegmentRule implements FallbackBidRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBidRuleAdjustment): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBidRuleAdjustmentCodePrefixRule implements FallbackBidRuleAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackBidRuleAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackBidRuleAdjustmentRequiredCurrencyRule implements FallbackBidRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBidRuleAdjustment): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBidRuleAdjustmentTitleLengthRule implements FallbackBidRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRuleAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBidRuleAdjustmentAllowedSegmentRule implements FallbackBidRuleAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackBidRuleAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is too long`];
    return [];
  }
}

export class FallbackBidRuleAdjustmentRequiredCodeRule implements FallbackBidRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBidRuleAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback bid rule adjustment. */
export class FallbackBidRuleAdjustmentValidator {
  rules: FallbackBidRuleAdjustmentRule[];

  constructor(rules: FallbackBidRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBidRuleAdjustment): string[] {
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

  requireValid(item: FallbackBidRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBidRuleAdjustment[]): Map<string, string[]> {
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

export function defaultFallbackBidRuleAdjustmentValidator(): FallbackBidRuleAdjustmentValidator {
  return new FallbackBidRuleAdjustmentValidator(
    [
      new FallbackBidRuleAdjustmentRequiredSegmentRule("fallback bid rule adjustment needs an entry"),
      new FallbackBidRuleAdjustmentCodePrefixRule("OPS"),
      new FallbackBidRuleAdjustmentRequiredCurrencyRule("fallback bid rule adjustment needs this field"),
      new FallbackBidRuleAdjustmentTitleLengthRule(80),
      new FallbackBidRuleAdjustmentAllowedSegmentRule(["primary", "global", "scheduled"]),
      new FallbackBidRuleAdjustmentRequiredCodeRule("fallback bid rule adjustment needs this field"),
    ],
  );
}
