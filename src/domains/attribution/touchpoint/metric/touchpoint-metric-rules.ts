import * as text from "../../../../kit/text.js";
import { TouchpointMetric } from "./touchpoint-metric.js";

/** A rule a touchpoint metric must pass. Check returns its problems, or none. */
export interface TouchpointMetricRule {
  check(item: TouchpointMetric): string[];
}

export class TouchpointMetricOpenRateRangeRule implements TouchpointMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointMetric): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointMetricCodePrefixRule implements TouchpointMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TouchpointMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TouchpointMetricAllowedTitleRule implements TouchpointMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a touchpoint metric. */
export class TouchpointMetricValidator {
  rules: TouchpointMetricRule[];

  constructor(rules: TouchpointMetricRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointMetric[]): Map<string, string[]> {
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

export function defaultTouchpointMetricValidator(): TouchpointMetricValidator {
  return new TouchpointMetricValidator(
    [
      new TouchpointMetricOpenRateRangeRule(1.4, 2014.1),
      new TouchpointMetricCodePrefixRule("Q"),
      new TouchpointMetricAllowedTitleRule(["rolling", "regional", "fallback"]),
    ],
  );
}
