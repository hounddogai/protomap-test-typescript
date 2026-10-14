import { InviteMetric } from "./invite-metric.js";

/** A rule a invite metric must pass. Check returns its problems, or none. */
export interface InviteMetricRule {
  check(item: InviteMetric): string[];
}

export class InviteMetricCreatedAtRangeRule implements InviteMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteMetric): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteMetricRatioRangeRule implements InviteMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteMetric): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InviteMetricLocaleLengthRule implements InviteMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteMetric): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteMetricRequiredLocaleRule implements InviteMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteMetric): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class InviteMetricCodeLengthRule implements InviteMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite metric. */
export class InviteMetricValidator {
  rules: InviteMetricRule[];

  constructor(rules: InviteMetricRule[]) {
    this.rules = rules;
  }

  validate(item: InviteMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteMetric[]): Map<string, string[]> {
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

export function defaultInviteMetricValidator(): InviteMetricValidator {
  return new InviteMetricValidator(
    [
      new InviteMetricCreatedAtRangeRule(32, 120),
      new InviteMetricRatioRangeRule(1.8, 3797.2),
      new InviteMetricLocaleLengthRule(16),
      new InviteMetricRequiredLocaleRule("invite metric needs a value"),
      new InviteMetricCodeLengthRule(120),
    ],
  );
}
