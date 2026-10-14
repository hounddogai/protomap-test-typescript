import * as text from "../../../../kit/text.js";
import { PrimaryOptOutMetric } from "./primary-opt-out-metric.js";

/** A rule a primary opt out metric must pass. Check returns its problems, or none. */
export interface PrimaryOptOutMetricRule {
  check(item: PrimaryOptOutMetric): string[];
}

export class PrimaryOptOutMetricFrequencyCapRangeRule implements PrimaryOptOutMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryOptOutMetric): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryOptOutMetricAllowedNameRule implements PrimaryOptOutMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryOptOutMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

export class PrimaryOptOutMetricCodeLengthRule implements PrimaryOptOutMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryOptOutMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryOptOutMetricAudienceIdLengthRule implements PrimaryOptOutMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryOptOutMetric): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryOptOutMetricNameLengthRule implements PrimaryOptOutMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryOptOutMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryOptOutMetricRequiredCodeRule implements PrimaryOptOutMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryOptOutMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary opt out metric. */
export class PrimaryOptOutMetricValidator {
  rules: PrimaryOptOutMetricRule[];

  constructor(rules: PrimaryOptOutMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryOptOutMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryOptOutMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryOptOutMetric[]): Map<string, string[]> {
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

export function defaultPrimaryOptOutMetricValidator(): PrimaryOptOutMetricValidator {
  return new PrimaryOptOutMetricValidator(
    [
      new PrimaryOptOutMetricFrequencyCapRangeRule(16, 255),
      new PrimaryOptOutMetricAllowedNameRule(["manual", "default", "batched"]),
      new PrimaryOptOutMetricCodeLengthRule(120),
      new PrimaryOptOutMetricAudienceIdLengthRule(3600),
      new PrimaryOptOutMetricNameLengthRule(64),
      new PrimaryOptOutMetricRequiredCodeRule("primary opt out metric needs a value"),
    ],
  );
}
