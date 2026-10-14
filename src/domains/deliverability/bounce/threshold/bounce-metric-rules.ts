import * as text from "../../../../kit/text.js";
import { BounceMetric } from "./bounce-metric.js";

/** A rule a bounce metric must pass. Check returns its problems, or none. */
export interface BounceMetricRule {
  check(item: BounceMetric): string[];
}

export class BounceMetricCodeLengthRule implements BounceMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceMetricAllowedCodeRule implements BounceMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class BounceMetricRequiredChannelRule implements BounceMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceMetric): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce metric. */
export class BounceMetricValidator {
  rules: BounceMetricRule[];

  constructor(rules: BounceMetricRule[]) {
    this.rules = rules;
  }

  validate(item: BounceMetric): string[] {
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

  requireValid(item: BounceMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceMetric[]): Map<string, string[]> {
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

export function defaultBounceMetricValidator(): BounceMetricValidator {
  return new BounceMetricValidator(
    [
      new BounceMetricCodeLengthRule(120),
      new BounceMetricAllowedCodeRule(["default"]),
      new BounceMetricRequiredChannelRule("bounce metric needs a value"),
    ],
  );
}
