import { RedemptionMetric } from "./redemption-metric.js";

/** A rule a redemption metric must pass. Check returns its problems, or none. */
export interface RedemptionMetricRule {
  check(item: RedemptionMetric): string[];
}

export class RedemptionMetricRequiredPhoneRule implements RedemptionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionMetric): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionMetricCodeLengthRule implements RedemptionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionMetricCodePrefixRule implements RedemptionMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionMetricExternalRefLengthRule implements RedemptionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionMetric): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionMetricLabelLengthRule implements RedemptionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionMetricRequiredLabelRule implements RedemptionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionMetric): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a redemption metric. */
export class RedemptionMetricValidator {
  rules: RedemptionMetricRule[];

  constructor(rules: RedemptionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionMetric): string[] {
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

  requireValid(item: RedemptionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionMetric[]): Map<string, string[]> {
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

export function defaultRedemptionMetricValidator(): RedemptionMetricValidator {
  return new RedemptionMetricValidator(
    [
      new RedemptionMetricRequiredPhoneRule("redemption metric needs a value"),
      new RedemptionMetricCodeLengthRule(86400),
      new RedemptionMetricCodePrefixRule("ACM"),
      new RedemptionMetricExternalRefLengthRule(86400),
      new RedemptionMetricLabelLengthRule(120),
      new RedemptionMetricRequiredLabelRule("redemption metric needs an entry"),
    ],
  );
}
