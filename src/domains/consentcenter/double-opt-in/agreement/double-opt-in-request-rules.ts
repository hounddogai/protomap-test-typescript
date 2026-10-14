import { DoubleOptInRequest } from "./double-opt-in-request.js";

/** A rule a double opt in request must pass. Check returns its problems, or none. */
export interface DoubleOptInRequestRule {
  check(item: DoubleOptInRequest): string[];
}

export class DoubleOptInRequestMaximumRangeRule implements DoubleOptInRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInRequest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInRequestCodePrefixRule implements DoubleOptInRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInRequestRateRangeRule implements DoubleOptInRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInRequest): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a double opt in request. */
export class DoubleOptInRequestValidator {
  rules: DoubleOptInRequestRule[];

  constructor(rules: DoubleOptInRequestRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInRequest): string[] {
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

  requireValid(item: DoubleOptInRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInRequest[]): Map<string, string[]> {
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

export function defaultDoubleOptInRequestValidator(): DoubleOptInRequestValidator {
  return new DoubleOptInRequestValidator(
    [
      new DoubleOptInRequestMaximumRangeRule(6.9, 1990.1),
      new DoubleOptInRequestCodePrefixRule("X"),
      new DoubleOptInRequestRateRangeRule(9.5, 781.3),
    ],
  );
}
