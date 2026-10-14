import * as text from "../../../../kit/text.js";
import { ConversionBaseline } from "./conversion-baseline.js";

/** A rule a conversion baseline must pass. Check returns its problems, or none. */
export interface ConversionBaselineRule {
  check(item: ConversionBaseline): string[];
}

export class ConversionBaselineAllowedReviewerRule implements ConversionBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is expired`];
    return [];
  }
}

export class ConversionBaselineRequiredReviewerRule implements ConversionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionBaseline): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionBaselineReviewerLengthRule implements ConversionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionBaseline): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionBaselineRequiredTitleRule implements ConversionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionBaselineTitleLengthRule implements ConversionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionBaselineRequiredUnitRule implements ConversionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionBaseline): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion baseline. */
export class ConversionBaselineValidator {
  rules: ConversionBaselineRule[];

  constructor(rules: ConversionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionBaseline): string[] {
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

  requireValid(item: ConversionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionBaseline[]): Map<string, string[]> {
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

export function defaultConversionBaselineValidator(): ConversionBaselineValidator {
  return new ConversionBaselineValidator(
    [
      new ConversionBaselineAllowedReviewerRule(["strict", "lenient"]),
      new ConversionBaselineRequiredReviewerRule("conversion baseline needs this field"),
      new ConversionBaselineReviewerLengthRule(32),
      new ConversionBaselineRequiredTitleRule("conversion baseline needs a value"),
      new ConversionBaselineTitleLengthRule(32),
      new ConversionBaselineRequiredUnitRule("conversion baseline needs a value"),
    ],
  );
}
