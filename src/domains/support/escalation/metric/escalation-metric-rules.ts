import * as text from "../../../../kit/text.js";
import { EscalationMetric } from "./escalation-metric.js";

/** A rule a escalation metric must pass. Check returns its problems, or none. */
export interface EscalationMetricRule {
  check(item: EscalationMetric): string[];
}

export class EscalationMetricAllowedCodeRule implements EscalationMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class EscalationMetricRequiredLabelRule implements EscalationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationMetricCodeLengthRule implements EscalationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationMetricContactEmailLengthRule implements EscalationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationMetric): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation metric. */
export class EscalationMetricValidator {
  rules: EscalationMetricRule[];

  constructor(rules: EscalationMetricRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationMetric[]): Map<string, string[]> {
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

export function defaultEscalationMetricValidator(): EscalationMetricValidator {
  return new EscalationMetricValidator(
    [
      new EscalationMetricAllowedCodeRule(["adaptive"]),
      new EscalationMetricRequiredLabelRule("escalation metric needs a value"),
      new EscalationMetricCodeLengthRule(32),
      new EscalationMetricContactEmailLengthRule(1000),
    ],
  );
}
