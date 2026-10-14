import * as text from "../../../../kit/text.js";
import { SuppressionThreshold } from "./suppression-threshold.js";

/** A rule a suppression threshold must pass. Check returns its problems, or none. */
export interface SuppressionThresholdRule {
  check(item: SuppressionThreshold): string[];
}

export class SuppressionThresholdNameLengthRule implements SuppressionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionThresholdAllowedTimezoneRule implements SuppressionThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is out of range`];
    return [];
  }
}

export class SuppressionThresholdCodePrefixRule implements SuppressionThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionThresholdAttemptsRangeRule implements SuppressionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionThreshold): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionThresholdTimezoneLengthRule implements SuppressionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionThreshold): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionThresholdRequiredTimezoneRule implements SuppressionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionThreshold): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression threshold. */
export class SuppressionThresholdValidator {
  rules: SuppressionThresholdRule[];

  constructor(rules: SuppressionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionThreshold[]): Map<string, string[]> {
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

export function defaultSuppressionThresholdValidator(): SuppressionThresholdValidator {
  return new SuppressionThresholdValidator(
    [
      new SuppressionThresholdNameLengthRule(32),
      new SuppressionThresholdAllowedTimezoneRule(["global", "fallback", "tiered"]),
      new SuppressionThresholdCodePrefixRule("Q"),
      new SuppressionThresholdAttemptsRangeRule(32, 255),
      new SuppressionThresholdTimezoneLengthRule(255),
      new SuppressionThresholdRequiredTimezoneRule("suppression threshold needs a value"),
    ],
  );
}
