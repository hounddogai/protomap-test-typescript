import * as text from "../../../../kit/text.js";
import { DoubleOptInThreshold } from "./double-opt-in-threshold.js";

/** A rule a double opt in threshold must pass. Check returns its problems, or none. */
export interface DoubleOptInThresholdRule {
  check(item: DoubleOptInThreshold): string[];
}

export class DoubleOptInThresholdBatchSizeRangeRule implements DoubleOptInThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInThreshold): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInThresholdCodePrefixRule implements DoubleOptInThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInThresholdVersionRangeRule implements DoubleOptInThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInThreshold): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInThresholdAllowedCodeRule implements DoubleOptInThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class DoubleOptInThresholdTitleLengthRule implements DoubleOptInThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a double opt in threshold. */
export class DoubleOptInThresholdValidator {
  rules: DoubleOptInThresholdRule[];

  constructor(rules: DoubleOptInThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInThreshold[]): Map<string, string[]> {
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

export function defaultDoubleOptInThresholdValidator(): DoubleOptInThresholdValidator {
  return new DoubleOptInThresholdValidator(
    [
      new DoubleOptInThresholdBatchSizeRangeRule(255, 1000),
      new DoubleOptInThresholdCodePrefixRule("X"),
      new DoubleOptInThresholdVersionRangeRule(120, 255),
      new DoubleOptInThresholdAllowedCodeRule(["tiered", "global", "fallback"]),
      new DoubleOptInThresholdTitleLengthRule(1000),
    ],
  );
}
