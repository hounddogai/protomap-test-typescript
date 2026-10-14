import * as text from "../../../../kit/text.js";
import { OptOutMetric } from "./opt-out-metric.js";

/** A rule a opt out metric must pass. Check returns its problems, or none. */
export interface OptOutMetricRule {
  check(item: OptOutMetric): string[];
}

export class OptOutMetricRequiredVariantRule implements OptOutMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutMetric): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutMetricVisibleGuardRule implements OptOutMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: OptOutMetric): string[] {
    if (item.visible && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class OptOutMetricAllowedLabelRule implements OptOutMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class OptOutMetricCodeLengthRule implements OptOutMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutMetricRequiredCodeRule implements OptOutMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out metric. */
export class OptOutMetricValidator {
  rules: OptOutMetricRule[];

  constructor(rules: OptOutMetricRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutMetric[]): Map<string, string[]> {
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

export function defaultOptOutMetricValidator(): OptOutMetricValidator {
  return new OptOutMetricValidator(
    [
      new OptOutMetricRequiredVariantRule("opt out metric needs an entry"),
      new OptOutMetricVisibleGuardRule(16),
      new OptOutMetricAllowedLabelRule(["manual", "legacy", "global"]),
      new OptOutMetricCodeLengthRule(16),
      new OptOutMetricRequiredCodeRule("opt out metric needs a value"),
    ],
  );
}
