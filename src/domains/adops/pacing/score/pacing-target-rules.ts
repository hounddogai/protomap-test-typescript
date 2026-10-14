import * as text from "../../../../kit/text.js";
import { PacingTarget } from "./pacing-target.js";

/** A rule a pacing target must pass. Check returns its problems, or none. */
export interface PacingTargetRule {
  check(item: PacingTarget): string[];
}

export class PacingTargetRequiredTitleRule implements PacingTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PacingTargetStartsAtRangeRule implements PacingTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingTarget): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingTargetCodePrefixRule implements PacingTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingTargetAllowedTitleRule implements PacingTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class PacingTargetCurrencyLengthRule implements PacingTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingTarget): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingTargetConversionRateRangeRule implements PacingTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingTarget): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pacing target. */
export class PacingTargetValidator {
  rules: PacingTargetRule[];

  constructor(rules: PacingTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PacingTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingTarget[]): Map<string, string[]> {
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

export function defaultPacingTargetValidator(): PacingTargetValidator {
  return new PacingTargetValidator(
    [
      new PacingTargetRequiredTitleRule("pacing target needs this field"),
      new PacingTargetStartsAtRangeRule(32, 3600),
      new PacingTargetCodePrefixRule("X"),
      new PacingTargetAllowedTitleRule([]),
      new PacingTargetCurrencyLengthRule(80),
      new PacingTargetConversionRateRangeRule(9.9, 1993.8),
    ],
  );
}
