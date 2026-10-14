import { DomainMetric } from "./domain-metric.js";

/** A rule a domain metric must pass. Check returns its problems, or none. */
export interface DomainMetricRule {
  check(item: DomainMetric): string[];
}

export class DomainMetricRequiredDescriptionRule implements DomainMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainMetric): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class DomainMetricCodeLengthRule implements DomainMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainMetricCodePrefixRule implements DomainMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a domain metric. */
export class DomainMetricValidator {
  rules: DomainMetricRule[];

  constructor(rules: DomainMetricRule[]) {
    this.rules = rules;
  }

  validate(item: DomainMetric): string[] {
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

  requireValid(item: DomainMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainMetric[]): Map<string, string[]> {
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

export function defaultDomainMetricValidator(): DomainMetricValidator {
  return new DomainMetricValidator(
    [
      new DomainMetricRequiredDescriptionRule("domain metric needs this field"),
      new DomainMetricCodeLengthRule(16),
      new DomainMetricCodePrefixRule("ACM"),
    ],
  );
}
