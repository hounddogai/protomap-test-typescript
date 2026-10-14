import { DoubleOptInBaseline } from "./double-opt-in-baseline.js";

/** A rule a double opt in baseline must pass. Check returns its problems, or none. */
export interface DoubleOptInBaselineRule {
  check(item: DoubleOptInBaseline): string[];
}

export class DoubleOptInBaselineChannelLengthRule implements DoubleOptInBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInBaseline): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInBaselineRequiredTitleRule implements DoubleOptInBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInBaselineRequiredChannelRule implements DoubleOptInBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInBaseline): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in baseline. */
export class DoubleOptInBaselineValidator {
  rules: DoubleOptInBaselineRule[];

  constructor(rules: DoubleOptInBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInBaseline): string[] {
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

  requireValid(item: DoubleOptInBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInBaseline[]): Map<string, string[]> {
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

export function defaultDoubleOptInBaselineValidator(): DoubleOptInBaselineValidator {
  return new DoubleOptInBaselineValidator(
    [
      new DoubleOptInBaselineChannelLengthRule(64),
      new DoubleOptInBaselineRequiredTitleRule("double opt in baseline needs an entry"),
      new DoubleOptInBaselineRequiredChannelRule("double opt in baseline needs a value"),
    ],
  );
}
