import * as text from "../../../../kit/text.js";
import { CappedMentionVariance } from "./capped-mention-variance.js";

/** A rule a capped mention variance must pass. Check returns its problems, or none. */
export interface CappedMentionVarianceRule {
  check(item: CappedMentionVariance): string[];
}

export class CappedMentionVarianceCodePrefixRule implements CappedMentionVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedMentionVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedMentionVarianceRequiredNameRule implements CappedMentionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedMentionVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedMentionVarianceAllowedJourneyIdRule implements CappedMentionVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedMentionVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is duplicated`];
    return [];
  }
}

export class CappedMentionVarianceQuantityRangeRule implements CappedMentionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedMentionVariance): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedMentionVarianceLocaleLengthRule implements CappedMentionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedMentionVariance): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedMentionVarianceRequiredCodeRule implements CappedMentionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedMentionVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped mention variance. */
export class CappedMentionVarianceValidator {
  rules: CappedMentionVarianceRule[];

  constructor(rules: CappedMentionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: CappedMentionVariance): string[] {
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

  requireValid(item: CappedMentionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedMentionVariance[]): Map<string, string[]> {
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

export function defaultCappedMentionVarianceValidator(): CappedMentionVarianceValidator {
  return new CappedMentionVarianceValidator(
    [
      new CappedMentionVarianceCodePrefixRule("REF"),
      new CappedMentionVarianceRequiredNameRule("capped mention variance needs a value"),
      new CappedMentionVarianceAllowedJourneyIdRule(["seasonal", "global"]),
      new CappedMentionVarianceQuantityRangeRule(120, 86400),
      new CappedMentionVarianceLocaleLengthRule(1000),
      new CappedMentionVarianceRequiredCodeRule("capped mention variance needs a value"),
    ],
  );
}
