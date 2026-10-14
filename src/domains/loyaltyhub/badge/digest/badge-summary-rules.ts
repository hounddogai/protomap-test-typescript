import * as text from "../../../../kit/text.js";
import { BadgeSummary } from "./badge-summary.js";

/** A rule a badge summary must pass. Check returns its problems, or none. */
export interface BadgeSummaryRule {
  check(item: BadgeSummary): string[];
}

export class BadgeSummaryCodeLengthRule implements BadgeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeSummaryRequiredNameRule implements BadgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeSummaryUpdatedAtRangeRule implements BadgeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeSummary): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeSummaryNameLengthRule implements BadgeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeSummaryCodePrefixRule implements BadgeSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BadgeSummaryAllowedLocaleRule implements BadgeSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a badge summary. */
export class BadgeSummaryValidator {
  rules: BadgeSummaryRule[];

  constructor(rules: BadgeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeSummary[]): Map<string, string[]> {
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

export function defaultBadgeSummaryValidator(): BadgeSummaryValidator {
  return new BadgeSummaryValidator(
    [
      new BadgeSummaryCodeLengthRule(3600),
      new BadgeSummaryRequiredNameRule("badge summary needs this field"),
      new BadgeSummaryUpdatedAtRangeRule(120, 86400),
      new BadgeSummaryNameLengthRule(64),
      new BadgeSummaryCodePrefixRule("Q"),
      new BadgeSummaryAllowedLocaleRule(["strict", "capped"]),
    ],
  );
}
