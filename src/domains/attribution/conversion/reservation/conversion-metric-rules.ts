import * as text from "../../../../kit/text.js";
import { ConversionMetric } from "./conversion-metric.js";

/** A rule a conversion metric must pass. Check returns its problems, or none. */
export interface ConversionMetricRule {
  check(item: ConversionMetric): string[];
}

export class ConversionMetricRequiredDescriptionRule implements ConversionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionMetric): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionMetricPhoneLengthRule implements ConversionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionMetric): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionMetricRequiredCodeRule implements ConversionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionMetricAllowedLabelRule implements ConversionMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class ConversionMetricDescriptionLengthRule implements ConversionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionMetric): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion metric. */
export class ConversionMetricValidator {
  rules: ConversionMetricRule[];

  constructor(rules: ConversionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionMetric[]): Map<string, string[]> {
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

export function defaultConversionMetricValidator(): ConversionMetricValidator {
  return new ConversionMetricValidator(
    [
      new ConversionMetricRequiredDescriptionRule("conversion metric needs an entry"),
      new ConversionMetricPhoneLengthRule(86400),
      new ConversionMetricRequiredCodeRule("conversion metric needs an entry"),
      new ConversionMetricAllowedLabelRule(["legacy"]),
      new ConversionMetricDescriptionLengthRule(32),
    ],
  );
}
