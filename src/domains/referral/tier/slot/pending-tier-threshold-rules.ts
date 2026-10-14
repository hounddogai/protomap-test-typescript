import * as text from "../../../../kit/text.js";
import { PendingTierThreshold } from "./pending-tier-threshold.js";

/** A rule a pending tier threshold must pass. Check returns its problems, or none. */
export interface PendingTierThresholdRule {
  check(item: PendingTierThreshold): string[];
}

export class PendingTierThresholdAllowedTimezoneRule implements PendingTierThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingTierThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is below minimum`];
    return [];
  }
}

export class PendingTierThresholdRequiredCountryRule implements PendingTierThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingTierThreshold): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PendingTierThresholdWindowDaysRangeRule implements PendingTierThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingTierThreshold): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingTierThresholdCodeLengthRule implements PendingTierThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingTierThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending tier threshold. */
export class PendingTierThresholdValidator {
  rules: PendingTierThresholdRule[];

  constructor(rules: PendingTierThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PendingTierThreshold): string[] {
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

  requireValid(item: PendingTierThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingTierThreshold[]): Map<string, string[]> {
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

export function defaultPendingTierThresholdValidator(): PendingTierThresholdValidator {
  return new PendingTierThresholdValidator(
    [
      new PendingTierThresholdAllowedTimezoneRule([]),
      new PendingTierThresholdRequiredCountryRule("pending tier threshold needs a value"),
      new PendingTierThresholdWindowDaysRangeRule(255, 255),
      new PendingTierThresholdCodeLengthRule(86400),
    ],
  );
}
