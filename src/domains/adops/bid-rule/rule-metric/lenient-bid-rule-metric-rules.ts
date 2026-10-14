import * as text from "../../../../kit/text.js";
import { LenientBidRuleMetric } from "./lenient-bid-rule-metric.js";

/** A rule a lenient bid rule metric must pass. Check returns its problems, or none. */
export interface LenientBidRuleMetricRule {
  check(item: LenientBidRuleMetric): string[];
}

export class LenientBidRuleMetricNameLengthRule implements LenientBidRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBidRuleMetricRequiredChecksumRule implements LenientBidRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBidRuleMetric): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBidRuleMetricCodePrefixRule implements LenientBidRuleMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientBidRuleMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientBidRuleMetricAllowedChecksumRule implements LenientBidRuleMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientBidRuleMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is too long`];
    return [];
  }
}

/** Runs every rule of a lenient bid rule metric. */
export class LenientBidRuleMetricValidator {
  rules: LenientBidRuleMetricRule[];

  constructor(rules: LenientBidRuleMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBidRuleMetric): string[] {
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

  requireValid(item: LenientBidRuleMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBidRuleMetric[]): Map<string, string[]> {
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

export function defaultLenientBidRuleMetricValidator(): LenientBidRuleMetricValidator {
  return new LenientBidRuleMetricValidator(
    [
      new LenientBidRuleMetricNameLengthRule(32),
      new LenientBidRuleMetricRequiredChecksumRule("lenient bid rule metric needs an entry"),
      new LenientBidRuleMetricCodePrefixRule("Q"),
      new LenientBidRuleMetricAllowedChecksumRule(["strict", "scheduled", "scheduled"]),
    ],
  );
}
