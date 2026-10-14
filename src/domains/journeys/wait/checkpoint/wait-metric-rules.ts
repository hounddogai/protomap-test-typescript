import { WaitMetric } from "./wait-metric.js";

/** A rule a wait metric must pass. Check returns its problems, or none. */
export interface WaitMetricRule {
  check(item: WaitMetric): string[];
}

export class WaitMetricCodePrefixRule implements WaitMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitMetricUpdatedAtRangeRule implements WaitMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitMetric): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitMetricRequiredVariantRule implements WaitMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitMetric): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait metric. */
export class WaitMetricValidator {
  rules: WaitMetricRule[];

  constructor(rules: WaitMetricRule[]) {
    this.rules = rules;
  }

  validate(item: WaitMetric): string[] {
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

  requireValid(item: WaitMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitMetric[]): Map<string, string[]> {
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

export function defaultWaitMetricValidator(): WaitMetricValidator {
  return new WaitMetricValidator(
    [
      new WaitMetricCodePrefixRule("OPS"),
      new WaitMetricUpdatedAtRangeRule(16, 255),
      new WaitMetricRequiredVariantRule("wait metric needs a value"),
    ],
  );
}
