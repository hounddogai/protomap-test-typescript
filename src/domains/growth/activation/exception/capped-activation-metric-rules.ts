import * as text from "../../../../kit/text.js";
import { CappedActivationMetric } from "./capped-activation-metric.js";

/** A rule a capped activation metric must pass. Check returns its problems, or none. */
export interface CappedActivationMetricRule {
  check(item: CappedActivationMetric): string[];
}

export class CappedActivationMetricCodeLengthRule implements CappedActivationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedActivationMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedActivationMetricRequiredNameRule implements CappedActivationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedActivationMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedActivationMetricCodePrefixRule implements CappedActivationMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedActivationMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedActivationMetricAllowedNameRule implements CappedActivationMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedActivationMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

/** Runs every rule of a capped activation metric. */
export class CappedActivationMetricValidator {
  rules: CappedActivationMetricRule[];

  constructor(rules: CappedActivationMetricRule[]) {
    this.rules = rules;
  }

  validate(item: CappedActivationMetric): string[] {
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

  requireValid(item: CappedActivationMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedActivationMetric[]): Map<string, string[]> {
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

export function defaultCappedActivationMetricValidator(): CappedActivationMetricValidator {
  return new CappedActivationMetricValidator(
    [
      new CappedActivationMetricCodeLengthRule(1000),
      new CappedActivationMetricRequiredNameRule("capped activation metric needs an entry"),
      new CappedActivationMetricCodePrefixRule("OPS"),
      new CappedActivationMetricAllowedNameRule(["rolling", "default"]),
    ],
  );
}
