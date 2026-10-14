import * as text from "../../../../kit/text.js";
import { PrimaryTierMetric } from "./primary-tier-metric.js";

/** A rule a primary tier metric must pass. Check returns its problems, or none. */
export interface PrimaryTierMetricRule {
  check(item: PrimaryTierMetric): string[];
}

export class PrimaryTierMetricRevisionRangeRule implements PrimaryTierMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTierMetric): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryTierMetricPriorityRangeRule implements PrimaryTierMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTierMetric): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryTierMetricJourneyIdLengthRule implements PrimaryTierMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTierMetric): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTierMetricNameLengthRule implements PrimaryTierMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTierMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTierMetricAllowedCodeRule implements PrimaryTierMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryTierMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class PrimaryTierMetricRequiredNameRule implements PrimaryTierMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTierMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary tier metric. */
export class PrimaryTierMetricValidator {
  rules: PrimaryTierMetricRule[];

  constructor(rules: PrimaryTierMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTierMetric): string[] {
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

  requireValid(item: PrimaryTierMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTierMetric[]): Map<string, string[]> {
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

export function defaultPrimaryTierMetricValidator(): PrimaryTierMetricValidator {
  return new PrimaryTierMetricValidator(
    [
      new PrimaryTierMetricRevisionRangeRule(32, 64),
      new PrimaryTierMetricPriorityRangeRule(16, 3600),
      new PrimaryTierMetricJourneyIdLengthRule(16),
      new PrimaryTierMetricNameLengthRule(3600),
      new PrimaryTierMetricAllowedCodeRule(["pending", "batched"]),
      new PrimaryTierMetricRequiredNameRule("primary tier metric needs a value"),
    ],
  );
}
