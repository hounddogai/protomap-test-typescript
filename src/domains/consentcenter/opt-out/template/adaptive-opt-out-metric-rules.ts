import { AdaptiveOptOutMetric } from "./adaptive-opt-out-metric.js";

/** A rule a adaptive opt out metric must pass. Check returns its problems, or none. */
export interface AdaptiveOptOutMetricRule {
  check(item: AdaptiveOptOutMetric): string[];
}

export class AdaptiveOptOutMetricContactEmailLengthRule implements AdaptiveOptOutMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveOptOutMetric): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveOptOutMetricCodeLengthRule implements AdaptiveOptOutMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveOptOutMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveOptOutMetricRequiredNameRule implements AdaptiveOptOutMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveOptOutMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive opt out metric. */
export class AdaptiveOptOutMetricValidator {
  rules: AdaptiveOptOutMetricRule[];

  constructor(rules: AdaptiveOptOutMetricRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveOptOutMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveOptOutMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveOptOutMetric[]): Map<string, string[]> {
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

export function defaultAdaptiveOptOutMetricValidator(): AdaptiveOptOutMetricValidator {
  return new AdaptiveOptOutMetricValidator(
    [
      new AdaptiveOptOutMetricContactEmailLengthRule(255),
      new AdaptiveOptOutMetricCodeLengthRule(16),
      new AdaptiveOptOutMetricRequiredNameRule("adaptive opt out metric needs a value"),
    ],
  );
}
