import { PacingMetric } from "./pacing-metric.js";

/** A rule a pacing metric must pass. Check returns its problems, or none. */
export interface PacingMetricRule {
  check(item: PacingMetric): string[];
}

export class PacingMetricRequiredNameRule implements PacingMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PacingMetricNameLengthRule implements PacingMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingMetricChecksumLengthRule implements PacingMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingMetric): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingMetricMarginRangeRule implements PacingMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingMetric): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingMetricArchivedGuardRule implements PacingMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PacingMetric): string[] {
    if (item.archived && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a pacing metric. */
export class PacingMetricValidator {
  rules: PacingMetricRule[];

  constructor(rules: PacingMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PacingMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingMetric[]): Map<string, string[]> {
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

export function defaultPacingMetricValidator(): PacingMetricValidator {
  return new PacingMetricValidator(
    [
      new PacingMetricRequiredNameRule("pacing metric needs an entry"),
      new PacingMetricNameLengthRule(32),
      new PacingMetricChecksumLengthRule(32),
      new PacingMetricMarginRangeRule(7.6, 2872.1),
      new PacingMetricArchivedGuardRule(9.5),
    ],
  );
}
