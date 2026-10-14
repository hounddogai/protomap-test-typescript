import * as text from "../../../../kit/text.js";
import { CreativeMetric } from "./creative-metric.js";

/** A rule a creative metric must pass. Check returns its problems, or none. */
export interface CreativeMetricRule {
  check(item: CreativeMetric): string[];
}

export class CreativeMetricCodeLengthRule implements CreativeMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeMetricReviewerLengthRule implements CreativeMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeMetric): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeMetricNameLengthRule implements CreativeMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeMetricAllowedNameRule implements CreativeMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

/** Runs every rule of a creative metric. */
export class CreativeMetricValidator {
  rules: CreativeMetricRule[];

  constructor(rules: CreativeMetricRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeMetric[]): Map<string, string[]> {
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

export function defaultCreativeMetricValidator(): CreativeMetricValidator {
  return new CreativeMetricValidator(
    [
      new CreativeMetricCodeLengthRule(1000),
      new CreativeMetricReviewerLengthRule(80),
      new CreativeMetricNameLengthRule(80),
      new CreativeMetricAllowedNameRule(["pending", "manual"]),
    ],
  );
}
