import * as text from "../../../../kit/text.js";
import { TieredConversionThreshold } from "./tiered-conversion-threshold.js";

/** A rule a tiered conversion threshold must pass. Check returns its problems, or none. */
export interface TieredConversionThresholdRule {
  check(item: TieredConversionThreshold): string[];
}

export class TieredConversionThresholdRequiredTimezoneRule implements TieredConversionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredConversionThreshold): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredConversionThresholdTimezoneLengthRule implements TieredConversionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredConversionThreshold): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredConversionThresholdAllowedChannelRule implements TieredConversionThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredConversionThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is duplicated`];
    return [];
  }
}

export class TieredConversionThresholdOpenRateRangeRule implements TieredConversionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredConversionThreshold): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredConversionThresholdChannelLengthRule implements TieredConversionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredConversionThreshold): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered conversion threshold. */
export class TieredConversionThresholdValidator {
  rules: TieredConversionThresholdRule[];

  constructor(rules: TieredConversionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: TieredConversionThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredConversionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredConversionThreshold[]): Map<string, string[]> {
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

export function defaultTieredConversionThresholdValidator(): TieredConversionThresholdValidator {
  return new TieredConversionThresholdValidator(
    [
      new TieredConversionThresholdRequiredTimezoneRule("tiered conversion threshold needs this field"),
      new TieredConversionThresholdTimezoneLengthRule(80),
      new TieredConversionThresholdAllowedChannelRule(["manual"]),
      new TieredConversionThresholdOpenRateRangeRule(6.3, 1614.8),
      new TieredConversionThresholdChannelLengthRule(86400),
    ],
  );
}
