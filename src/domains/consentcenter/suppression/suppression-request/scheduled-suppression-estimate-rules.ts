import * as text from "../../../../kit/text.js";
import { ScheduledSuppressionEstimate } from "./scheduled-suppression-estimate.js";

/** A rule a scheduled suppression estimate must pass. Check returns its problems, or none. */
export interface ScheduledSuppressionEstimateRule {
  check(item: ScheduledSuppressionEstimate): string[];
}

export class ScheduledSuppressionEstimateRequiredExternalRefRule implements ScheduledSuppressionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSuppressionEstimate): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSuppressionEstimateAllowedNameRule implements ScheduledSuppressionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSuppressionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class ScheduledSuppressionEstimateCeilingRangeRule implements ScheduledSuppressionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSuppressionEstimate): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledSuppressionEstimateRequiredChannelRule implements ScheduledSuppressionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSuppressionEstimate): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSuppressionEstimateExternalRefLengthRule implements ScheduledSuppressionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSuppressionEstimate): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled suppression estimate. */
export class ScheduledSuppressionEstimateValidator {
  rules: ScheduledSuppressionEstimateRule[];

  constructor(rules: ScheduledSuppressionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSuppressionEstimate): string[] {
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

  requireValid(item: ScheduledSuppressionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSuppressionEstimate[]): Map<string, string[]> {
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

export function defaultScheduledSuppressionEstimateValidator(): ScheduledSuppressionEstimateValidator {
  return new ScheduledSuppressionEstimateValidator(
    [
      new ScheduledSuppressionEstimateRequiredExternalRefRule("scheduled suppression estimate needs a value"),
      new ScheduledSuppressionEstimateAllowedNameRule([]),
      new ScheduledSuppressionEstimateCeilingRangeRule(7.2, 355.7),
      new ScheduledSuppressionEstimateRequiredChannelRule("scheduled suppression estimate needs this field"),
      new ScheduledSuppressionEstimateExternalRefLengthRule(1000),
    ],
  );
}
