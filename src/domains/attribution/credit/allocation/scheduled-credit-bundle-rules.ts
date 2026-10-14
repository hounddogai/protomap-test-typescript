import * as text from "../../../../kit/text.js";
import { ScheduledCreditBundle } from "./scheduled-credit-bundle.js";

/** A rule a scheduled credit bundle must pass. Check returns its problems, or none. */
export interface ScheduledCreditBundleRule {
  check(item: ScheduledCreditBundle): string[];
}

export class ScheduledCreditBundleRequiredTitleRule implements ScheduledCreditBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreditBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCreditBundleTitleLengthRule implements ScheduledCreditBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCreditBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCreditBundleAllowedContactEmailRule implements ScheduledCreditBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledCreditBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is too long`];
    return [];
  }
}

export class ScheduledCreditBundleRequiredContactEmailRule implements ScheduledCreditBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreditBundle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCreditBundleBudgetRangeRule implements ScheduledCreditBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreditBundle): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledCreditBundleCodePrefixRule implements ScheduledCreditBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledCreditBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled credit bundle. */
export class ScheduledCreditBundleValidator {
  rules: ScheduledCreditBundleRule[];

  constructor(rules: ScheduledCreditBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCreditBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCreditBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCreditBundle[]): Map<string, string[]> {
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

export function defaultScheduledCreditBundleValidator(): ScheduledCreditBundleValidator {
  return new ScheduledCreditBundleValidator(
    [
      new ScheduledCreditBundleRequiredTitleRule("scheduled credit bundle needs an entry"),
      new ScheduledCreditBundleTitleLengthRule(255),
      new ScheduledCreditBundleAllowedContactEmailRule(["manual", "legacy", "legacy"]),
      new ScheduledCreditBundleRequiredContactEmailRule("scheduled credit bundle needs this field"),
      new ScheduledCreditBundleBudgetRangeRule(6.7, 3172.5),
      new ScheduledCreditBundleCodePrefixRule("REF"),
    ],
  );
}
