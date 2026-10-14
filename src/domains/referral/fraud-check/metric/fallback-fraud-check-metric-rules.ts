import * as text from "../../../../kit/text.js";
import { FallbackFraudCheckMetric } from "./fallback-fraud-check-metric.js";

/** A rule a fallback fraud check metric must pass. Check returns its problems, or none. */
export interface FallbackFraudCheckMetricRule {
  check(item: FallbackFraudCheckMetric): string[];
}

export class FallbackFraudCheckMetricCodeLengthRule implements FallbackFraudCheckMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFraudCheckMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFraudCheckMetricChecksumLengthRule implements FallbackFraudCheckMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFraudCheckMetric): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFraudCheckMetricCapacityRangeRule implements FallbackFraudCheckMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFraudCheckMetric): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackFraudCheckMetricAllowedCodeRule implements FallbackFraudCheckMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackFraudCheckMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class FallbackFraudCheckMetricRequiredChecksumRule implements FallbackFraudCheckMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFraudCheckMetric): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFraudCheckMetricRequiredCodeRule implements FallbackFraudCheckMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFraudCheckMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback fraud check metric. */
export class FallbackFraudCheckMetricValidator {
  rules: FallbackFraudCheckMetricRule[];

  constructor(rules: FallbackFraudCheckMetricRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFraudCheckMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackFraudCheckMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFraudCheckMetric[]): Map<string, string[]> {
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

export function defaultFallbackFraudCheckMetricValidator(): FallbackFraudCheckMetricValidator {
  return new FallbackFraudCheckMetricValidator(
    [
      new FallbackFraudCheckMetricCodeLengthRule(86400),
      new FallbackFraudCheckMetricChecksumLengthRule(1000),
      new FallbackFraudCheckMetricCapacityRangeRule(64, 3600),
      new FallbackFraudCheckMetricAllowedCodeRule([]),
      new FallbackFraudCheckMetricRequiredChecksumRule("fallback fraud check metric needs this field"),
      new FallbackFraudCheckMetricRequiredCodeRule("fallback fraud check metric needs this field"),
    ],
  );
}
