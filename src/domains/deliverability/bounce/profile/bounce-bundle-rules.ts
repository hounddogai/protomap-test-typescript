import * as text from "../../../../kit/text.js";
import { BounceBundle } from "./bounce-bundle.js";

/** A rule a bounce bundle must pass. Check returns its problems, or none. */
export interface BounceBundleRule {
  check(item: BounceBundle): string[];
}

export class BounceBundleRatioRangeRule implements BounceBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceBundle): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BounceBundleRequiredCodeRule implements BounceBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceBundleLabelLengthRule implements BounceBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceBundleDescriptionLengthRule implements BounceBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceBundle): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceBundleAllowedDescriptionRule implements BounceBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is not allowed`];
    return [];
  }
}

export class BounceBundleTimezoneLengthRule implements BounceBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceBundle): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce bundle. */
export class BounceBundleValidator {
  rules: BounceBundleRule[];

  constructor(rules: BounceBundleRule[]) {
    this.rules = rules;
  }

  validate(item: BounceBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceBundle[]): Map<string, string[]> {
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

export function defaultBounceBundleValidator(): BounceBundleValidator {
  return new BounceBundleValidator(
    [
      new BounceBundleRatioRangeRule(5, 4128.6),
      new BounceBundleRequiredCodeRule("bounce bundle needs this field"),
      new BounceBundleLabelLengthRule(120),
      new BounceBundleDescriptionLengthRule(255),
      new BounceBundleAllowedDescriptionRule(["batched", "lenient"]),
      new BounceBundleTimezoneLengthRule(32),
    ],
  );
}
