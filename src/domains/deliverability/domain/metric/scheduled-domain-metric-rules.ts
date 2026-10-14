import * as text from "../../../../kit/text.js";
import { ScheduledDomainMetric } from "./scheduled-domain-metric.js";

/** A rule a scheduled domain metric must pass. Check returns its problems, or none. */
export interface ScheduledDomainMetricRule {
  check(item: ScheduledDomainMetric): string[];
}

export class ScheduledDomainMetricPriorityRangeRule implements ScheduledDomainMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDomainMetric): string[] {
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

export class ScheduledDomainMetricCodeLengthRule implements ScheduledDomainMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDomainMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDomainMetricRequiredLabelRule implements ScheduledDomainMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDomainMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDomainMetricAllowedCodeRule implements ScheduledDomainMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledDomainMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a scheduled domain metric. */
export class ScheduledDomainMetricValidator {
  rules: ScheduledDomainMetricRule[];

  constructor(rules: ScheduledDomainMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDomainMetric): string[] {
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

  requireValid(item: ScheduledDomainMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDomainMetric[]): Map<string, string[]> {
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

export function defaultScheduledDomainMetricValidator(): ScheduledDomainMetricValidator {
  return new ScheduledDomainMetricValidator(
    [
      new ScheduledDomainMetricPriorityRangeRule(255, 86400),
      new ScheduledDomainMetricCodeLengthRule(120),
      new ScheduledDomainMetricRequiredLabelRule("scheduled domain metric needs this field"),
      new ScheduledDomainMetricAllowedCodeRule(["scheduled", "legacy", "global"]),
    ],
  );
}
