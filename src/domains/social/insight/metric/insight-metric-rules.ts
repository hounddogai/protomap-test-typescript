import * as text from "../../../../kit/text.js";
import { InsightMetric } from "./insight-metric.js";

/** A rule a insight metric must pass. Check returns its problems, or none. */
export interface InsightMetricRule {
  check(item: InsightMetric): string[];
}

export class InsightMetricRequiredCodeRule implements InsightMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightMetricCategoryLengthRule implements InsightMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightMetric): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightMetricAllowedChannelRule implements InsightMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is duplicated`];
    return [];
  }
}

export class InsightMetricCodePrefixRule implements InsightMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a insight metric. */
export class InsightMetricValidator {
  rules: InsightMetricRule[];

  constructor(rules: InsightMetricRule[]) {
    this.rules = rules;
  }

  validate(item: InsightMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightMetric[]): Map<string, string[]> {
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

export function defaultInsightMetricValidator(): InsightMetricValidator {
  return new InsightMetricValidator(
    [
      new InsightMetricRequiredCodeRule("insight metric needs a value"),
      new InsightMetricCategoryLengthRule(32),
      new InsightMetricAllowedChannelRule(["regional", "pending"]),
      new InsightMetricCodePrefixRule("Q"),
    ],
  );
}
