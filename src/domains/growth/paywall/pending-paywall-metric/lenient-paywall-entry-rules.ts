import * as text from "../../../../kit/text.js";
import { LenientPaywallEntry } from "./lenient-paywall-entry.js";

/** A rule a lenient paywall entry must pass. Check returns its problems, or none. */
export interface LenientPaywallEntryRule {
  check(item: LenientPaywallEntry): string[];
}

export class LenientPaywallEntryRequiredCodeRule implements LenientPaywallEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPaywallEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPaywallEntryMaximumRangeRule implements LenientPaywallEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPaywallEntry): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPaywallEntrySummaryLengthRule implements LenientPaywallEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPaywallEntry): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPaywallEntryTitleLengthRule implements LenientPaywallEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPaywallEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPaywallEntryAllowedSummaryRule implements LenientPaywallEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPaywallEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is duplicated`];
    return [];
  }
}

/** Runs every rule of a lenient paywall entry. */
export class LenientPaywallEntryValidator {
  rules: LenientPaywallEntryRule[];

  constructor(rules: LenientPaywallEntryRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPaywallEntry): string[] {
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

  requireValid(item: LenientPaywallEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPaywallEntry[]): Map<string, string[]> {
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

export function defaultLenientPaywallEntryValidator(): LenientPaywallEntryValidator {
  return new LenientPaywallEntryValidator(
    [
      new LenientPaywallEntryRequiredCodeRule("lenient paywall entry needs a value"),
      new LenientPaywallEntryMaximumRangeRule(1.2, 3560.1),
      new LenientPaywallEntrySummaryLengthRule(3600),
      new LenientPaywallEntryTitleLengthRule(32),
      new LenientPaywallEntryAllowedSummaryRule(["rolling"]),
    ],
  );
}
