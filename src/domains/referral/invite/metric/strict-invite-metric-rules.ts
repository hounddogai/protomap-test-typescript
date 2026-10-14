import { StrictInviteMetric } from "./strict-invite-metric.js";

/** A rule a strict invite metric must pass. Check returns its problems, or none. */
export interface StrictInviteMetricRule {
  check(item: StrictInviteMetric): string[];
}

export class StrictInviteMetricRequiredNotesRule implements StrictInviteMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictInviteMetric): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class StrictInviteMetricContactEmailLengthRule implements StrictInviteMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictInviteMetric): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictInviteMetricBudgetRangeRule implements StrictInviteMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictInviteMetric): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictInviteMetricRequiredContactEmailRule implements StrictInviteMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictInviteMetric): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class StrictInviteMetricCodeLengthRule implements StrictInviteMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictInviteMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict invite metric. */
export class StrictInviteMetricValidator {
  rules: StrictInviteMetricRule[];

  constructor(rules: StrictInviteMetricRule[]) {
    this.rules = rules;
  }

  validate(item: StrictInviteMetric): string[] {
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

  requireValid(item: StrictInviteMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictInviteMetric[]): Map<string, string[]> {
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

export function defaultStrictInviteMetricValidator(): StrictInviteMetricValidator {
  return new StrictInviteMetricValidator(
    [
      new StrictInviteMetricRequiredNotesRule("strict invite metric needs an entry"),
      new StrictInviteMetricContactEmailLengthRule(255),
      new StrictInviteMetricBudgetRangeRule(2.1, 4014.6),
      new StrictInviteMetricRequiredContactEmailRule("strict invite metric needs an entry"),
      new StrictInviteMetricCodeLengthRule(1000),
    ],
  );
}
