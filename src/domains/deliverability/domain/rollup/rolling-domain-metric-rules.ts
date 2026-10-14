import * as text from "../../../../kit/text.js";
import { RollingDomainMetric } from "./rolling-domain-metric.js";

/** A rule a rolling domain metric must pass. Check returns its problems, or none. */
export interface RollingDomainMetricRule {
  check(item: RollingDomainMetric): string[];
}

export class RollingDomainMetricCodePrefixRule implements RollingDomainMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingDomainMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingDomainMetricExpiresAtRangeRule implements RollingDomainMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingDomainMetric): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingDomainMetricAllowedCodeRule implements RollingDomainMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingDomainMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class RollingDomainMetricRegionLengthRule implements RollingDomainMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDomainMetric): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling domain metric. */
export class RollingDomainMetricValidator {
  rules: RollingDomainMetricRule[];

  constructor(rules: RollingDomainMetricRule[]) {
    this.rules = rules;
  }

  validate(item: RollingDomainMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingDomainMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingDomainMetric[]): Map<string, string[]> {
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

export function defaultRollingDomainMetricValidator(): RollingDomainMetricValidator {
  return new RollingDomainMetricValidator(
    [
      new RollingDomainMetricCodePrefixRule("Q"),
      new RollingDomainMetricExpiresAtRangeRule(16, 120),
      new RollingDomainMetricAllowedCodeRule([]),
      new RollingDomainMetricRegionLengthRule(1000),
    ],
  );
}
