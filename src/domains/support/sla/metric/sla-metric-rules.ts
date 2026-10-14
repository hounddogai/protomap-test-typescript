import * as text from "../../../../kit/text.js";
import { SlaMetric } from "./sla-metric.js";

/** A rule a sla metric must pass. Check returns its problems, or none. */
export interface SlaMetricRule {
  check(item: SlaMetric): string[];
}

export class SlaMetricLimitRangeRule implements SlaMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaMetric): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaMetricAllowedLabelRule implements SlaMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class SlaMetricTagsLimitRule implements SlaMetricRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: SlaMetric): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class SlaMetricCodePrefixRule implements SlaMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaMetricRequiredCodeRule implements SlaMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaMetricLabelLengthRule implements SlaMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla metric. */
export class SlaMetricValidator {
  rules: SlaMetricRule[];

  constructor(rules: SlaMetricRule[]) {
    this.rules = rules;
  }

  validate(item: SlaMetric): string[] {
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

  requireValid(item: SlaMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaMetric[]): Map<string, string[]> {
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

export function defaultSlaMetricValidator(): SlaMetricValidator {
  return new SlaMetricValidator(
    [
      new SlaMetricLimitRangeRule(64, 3600),
      new SlaMetricAllowedLabelRule(["seasonal", "rolling"]),
      new SlaMetricTagsLimitRule(3600, ["pending", "primary", "batched"]),
      new SlaMetricCodePrefixRule("ACM"),
      new SlaMetricRequiredCodeRule("sla metric needs a value"),
      new SlaMetricLabelLengthRule(80),
    ],
  );
}
