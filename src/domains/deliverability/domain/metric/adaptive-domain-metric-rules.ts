import { AdaptiveDomainMetric } from "./adaptive-domain-metric.js";

/** A rule a adaptive domain metric must pass. Check returns its problems, or none. */
export interface AdaptiveDomainMetricRule {
  check(item: AdaptiveDomainMetric): string[];
}

export class AdaptiveDomainMetricRequiredCodeRule implements AdaptiveDomainMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainMetricSummaryLengthRule implements AdaptiveDomainMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainMetric): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDomainMetricCodeLengthRule implements AdaptiveDomainMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDomainMetricNameLengthRule implements AdaptiveDomainMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive domain metric. */
export class AdaptiveDomainMetricValidator {
  rules: AdaptiveDomainMetricRule[];

  constructor(rules: AdaptiveDomainMetricRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDomainMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveDomainMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDomainMetric[]): Map<string, string[]> {
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

export function defaultAdaptiveDomainMetricValidator(): AdaptiveDomainMetricValidator {
  return new AdaptiveDomainMetricValidator(
    [
      new AdaptiveDomainMetricRequiredCodeRule("adaptive domain metric needs this field"),
      new AdaptiveDomainMetricSummaryLengthRule(16),
      new AdaptiveDomainMetricCodeLengthRule(64),
      new AdaptiveDomainMetricNameLengthRule(3600),
    ],
  );
}
