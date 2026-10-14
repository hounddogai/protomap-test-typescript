import * as text from "../../../../kit/text.js";
import { CappedDomainThreshold } from "./capped-domain-threshold.js";

/** A rule a capped domain threshold must pass. Check returns its problems, or none. */
export interface CappedDomainThresholdRule {
  check(item: CappedDomainThreshold): string[];
}

export class CappedDomainThresholdCategoryLengthRule implements CappedDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDomainThreshold): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDomainThresholdCodePrefixRule implements CappedDomainThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedDomainThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedDomainThresholdAllowedCurrencyRule implements CappedDomainThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedDomainThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is above maximum`];
    return [];
  }
}

export class CappedDomainThresholdClicksRangeRule implements CappedDomainThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedDomainThreshold): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped domain threshold. */
export class CappedDomainThresholdValidator {
  rules: CappedDomainThresholdRule[];

  constructor(rules: CappedDomainThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDomainThreshold): string[] {
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

  requireValid(item: CappedDomainThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDomainThreshold[]): Map<string, string[]> {
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

export function defaultCappedDomainThresholdValidator(): CappedDomainThresholdValidator {
  return new CappedDomainThresholdValidator(
    [
      new CappedDomainThresholdCategoryLengthRule(86400),
      new CappedDomainThresholdCodePrefixRule("OPS"),
      new CappedDomainThresholdAllowedCurrencyRule(["primary"]),
      new CappedDomainThresholdClicksRangeRule(80, 86400),
    ],
  );
}
