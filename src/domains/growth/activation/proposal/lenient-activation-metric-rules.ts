import { LenientActivationMetric } from "./lenient-activation-metric.js";

/** A rule a lenient activation metric must pass. Check returns its problems, or none. */
export interface LenientActivationMetricRule {
  check(item: LenientActivationMetric): string[];
}

export class LenientActivationMetricCodeLengthRule implements LenientActivationMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientActivationMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientActivationMetricRequiredCodeRule implements LenientActivationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientActivationMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientActivationMetricRequiredNameRule implements LenientActivationMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientActivationMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientActivationMetricCodePrefixRule implements LenientActivationMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientActivationMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient activation metric. */
export class LenientActivationMetricValidator {
  rules: LenientActivationMetricRule[];

  constructor(rules: LenientActivationMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LenientActivationMetric): string[] {
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

  requireValid(item: LenientActivationMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientActivationMetric[]): Map<string, string[]> {
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

export function defaultLenientActivationMetricValidator(): LenientActivationMetricValidator {
  return new LenientActivationMetricValidator(
    [
      new LenientActivationMetricCodeLengthRule(1000),
      new LenientActivationMetricRequiredCodeRule("lenient activation metric needs a value"),
      new LenientActivationMetricRequiredNameRule("lenient activation metric needs an entry"),
      new LenientActivationMetricCodePrefixRule("REF"),
    ],
  );
}
