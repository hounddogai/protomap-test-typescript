import * as text from "../../../../kit/text.js";
import { PrimaryFunnelBaseline } from "./primary-funnel-baseline.js";

/** A rule a primary funnel baseline must pass. Check returns its problems, or none. */
export interface PrimaryFunnelBaselineRule {
  check(item: PrimaryFunnelBaseline): string[];
}

export class PrimaryFunnelBaselineNameLengthRule implements PrimaryFunnelBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFunnelBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFunnelBaselineCodePrefixRule implements PrimaryFunnelBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryFunnelBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryFunnelBaselineRequiredNameRule implements PrimaryFunnelBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFunnelBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFunnelBaselineAllowedCurrencyRule implements PrimaryFunnelBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryFunnelBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is unknown`];
    return [];
  }
}

export class PrimaryFunnelBaselineSequenceRangeRule implements PrimaryFunnelBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFunnelBaseline): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryFunnelBaselineCohortLengthRule implements PrimaryFunnelBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFunnelBaseline): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary funnel baseline. */
export class PrimaryFunnelBaselineValidator {
  rules: PrimaryFunnelBaselineRule[];

  constructor(rules: PrimaryFunnelBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFunnelBaseline): string[] {
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

  requireValid(item: PrimaryFunnelBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFunnelBaseline[]): Map<string, string[]> {
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

export function defaultPrimaryFunnelBaselineValidator(): PrimaryFunnelBaselineValidator {
  return new PrimaryFunnelBaselineValidator(
    [
      new PrimaryFunnelBaselineNameLengthRule(64),
      new PrimaryFunnelBaselineCodePrefixRule("Q"),
      new PrimaryFunnelBaselineRequiredNameRule("primary funnel baseline needs this field"),
      new PrimaryFunnelBaselineAllowedCurrencyRule(["primary", "rolling"]),
      new PrimaryFunnelBaselineSequenceRangeRule(32, 1000),
      new PrimaryFunnelBaselineCohortLengthRule(120),
    ],
  );
}
