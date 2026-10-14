import * as text from "../../../../kit/text.js";
import { DefaultSuppressionEstimate } from "./default-suppression-estimate.js";

/** A rule a default suppression estimate must pass. Check returns its problems, or none. */
export interface DefaultSuppressionEstimateRule {
  check(item: DefaultSuppressionEstimate): string[];
}

export class DefaultSuppressionEstimateTitleLengthRule implements DefaultSuppressionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSuppressionEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSuppressionEstimateVisibleGuardRule implements DefaultSuppressionEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultSuppressionEstimate): string[] {
    if (item.visible && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class DefaultSuppressionEstimateImpressionsRangeRule implements DefaultSuppressionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSuppressionEstimate): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultSuppressionEstimateAllowedOwnerIdRule implements DefaultSuppressionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultSuppressionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is missing`];
    return [];
  }
}

export class DefaultSuppressionEstimateCodePrefixRule implements DefaultSuppressionEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultSuppressionEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultSuppressionEstimateDurationMinutesRangeRule implements DefaultSuppressionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSuppressionEstimate): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default suppression estimate. */
export class DefaultSuppressionEstimateValidator {
  rules: DefaultSuppressionEstimateRule[];

  constructor(rules: DefaultSuppressionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSuppressionEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultSuppressionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSuppressionEstimate[]): Map<string, string[]> {
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

export function defaultDefaultSuppressionEstimateValidator(): DefaultSuppressionEstimateValidator {
  return new DefaultSuppressionEstimateValidator(
    [
      new DefaultSuppressionEstimateTitleLengthRule(86400),
      new DefaultSuppressionEstimateVisibleGuardRule(80),
      new DefaultSuppressionEstimateImpressionsRangeRule(16, 3600),
      new DefaultSuppressionEstimateAllowedOwnerIdRule(["capped"]),
      new DefaultSuppressionEstimateCodePrefixRule("ACM"),
      new DefaultSuppressionEstimateDurationMinutesRangeRule(32, 1000),
    ],
  );
}
