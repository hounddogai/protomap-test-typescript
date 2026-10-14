import * as text from "../../../../kit/text.js";
import { TouchpointVariance } from "./touchpoint-variance.js";

/** A rule a touchpoint variance must pass. Check returns its problems, or none. */
export interface TouchpointVarianceRule {
  check(item: TouchpointVariance): string[];
}

export class TouchpointVarianceFrequencyCapRangeRule implements TouchpointVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointVariance): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointVarianceRequiredCodeRule implements TouchpointVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointVarianceBatchSizeRangeRule implements TouchpointVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointVariance): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointVarianceCodePrefixRule implements TouchpointVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TouchpointVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TouchpointVarianceAllowedSummaryRule implements TouchpointVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is missing`];
    return [];
  }
}

export class TouchpointVarianceSummaryLengthRule implements TouchpointVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointVariance): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint variance. */
export class TouchpointVarianceValidator {
  rules: TouchpointVarianceRule[];

  constructor(rules: TouchpointVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointVariance): string[] {
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

  requireValid(item: TouchpointVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointVariance[]): Map<string, string[]> {
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

export function defaultTouchpointVarianceValidator(): TouchpointVarianceValidator {
  return new TouchpointVarianceValidator(
    [
      new TouchpointVarianceFrequencyCapRangeRule(64, 255),
      new TouchpointVarianceRequiredCodeRule("touchpoint variance needs this field"),
      new TouchpointVarianceBatchSizeRangeRule(32, 3600),
      new TouchpointVarianceCodePrefixRule("OPS"),
      new TouchpointVarianceAllowedSummaryRule(["global"]),
      new TouchpointVarianceSummaryLengthRule(120),
    ],
  );
}
