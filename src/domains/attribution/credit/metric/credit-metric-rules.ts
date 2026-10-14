import * as text from "../../../../kit/text.js";
import { CreditMetric } from "./credit-metric.js";

/** A rule a credit metric must pass. Check returns its problems, or none. */
export interface CreditMetricRule {
  check(item: CreditMetric): string[];
}

export class CreditMetricAllowedCountryRule implements CreditMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is not allowed`];
    return [];
  }
}

export class CreditMetricRequiredLabelRule implements CreditMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CreditMetricCodePrefixRule implements CreditMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a credit metric. */
export class CreditMetricValidator {
  rules: CreditMetricRule[];

  constructor(rules: CreditMetricRule[]) {
    this.rules = rules;
  }

  validate(item: CreditMetric): string[] {
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

  requireValid(item: CreditMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditMetric[]): Map<string, string[]> {
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

export function defaultCreditMetricValidator(): CreditMetricValidator {
  return new CreditMetricValidator(
    [
      new CreditMetricAllowedCountryRule(["pending", "default"]),
      new CreditMetricRequiredLabelRule("credit metric needs an entry"),
      new CreditMetricCodePrefixRule("X"),
    ],
  );
}
