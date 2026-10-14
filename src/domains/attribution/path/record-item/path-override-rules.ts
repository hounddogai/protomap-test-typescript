import * as text from "../../../../kit/text.js";
import { PathOverride } from "./path-override.js";

/** A rule a path override must pass. Check returns its problems, or none. */
export interface PathOverrideRule {
  check(item: PathOverride): string[];
}

export class PathOverrideTitleLengthRule implements PathOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathOverrideAllowedCodeRule implements PathOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class PathOverrideAmountRangeRule implements PathOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathOverride): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathOverrideConversionRateRangeRule implements PathOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathOverride): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathOverrideCodeLengthRule implements PathOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathOverrideRequiredTitleRule implements PathOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path override. */
export class PathOverrideValidator {
  rules: PathOverrideRule[];

  constructor(rules: PathOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PathOverride): string[] {
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

  requireValid(item: PathOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathOverride[]): Map<string, string[]> {
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

export function defaultPathOverrideValidator(): PathOverrideValidator {
  return new PathOverrideValidator(
    [
      new PathOverrideTitleLengthRule(80),
      new PathOverrideAllowedCodeRule(["lenient", "tiered"]),
      new PathOverrideAmountRangeRule(6.9, 4529.4),
      new PathOverrideConversionRateRangeRule(7.3, 2425.7),
      new PathOverrideCodeLengthRule(86400),
      new PathOverrideRequiredTitleRule("path override needs an entry"),
    ],
  );
}
