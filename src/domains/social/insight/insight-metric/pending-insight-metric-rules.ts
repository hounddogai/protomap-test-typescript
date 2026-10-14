import * as text from "../../../../kit/text.js";
import { PendingInsightMetric } from "./pending-insight-metric.js";

/** A rule a pending insight metric must pass. Check returns its problems, or none. */
export interface PendingInsightMetricRule {
  check(item: PendingInsightMetric): string[];
}

export class PendingInsightMetricCodePrefixRule implements PendingInsightMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingInsightMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingInsightMetricAllowedCodeRule implements PendingInsightMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingInsightMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class PendingInsightMetricRequiredNameRule implements PendingInsightMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInsightMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending insight metric. */
export class PendingInsightMetricValidator {
  rules: PendingInsightMetricRule[];

  constructor(rules: PendingInsightMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PendingInsightMetric): string[] {
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

  requireValid(item: PendingInsightMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingInsightMetric[]): Map<string, string[]> {
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

export function defaultPendingInsightMetricValidator(): PendingInsightMetricValidator {
  return new PendingInsightMetricValidator(
    [
      new PendingInsightMetricCodePrefixRule("REF"),
      new PendingInsightMetricAllowedCodeRule(["global"]),
      new PendingInsightMetricRequiredNameRule("pending insight metric needs a value"),
    ],
  );
}
