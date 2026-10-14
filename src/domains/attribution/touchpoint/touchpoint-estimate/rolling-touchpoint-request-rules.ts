import { RollingTouchpointRequest } from "./rolling-touchpoint-request.js";

/** A rule a rolling touchpoint request must pass. Check returns its problems, or none. */
export interface RollingTouchpointRequestRule {
  check(item: RollingTouchpointRequest): string[];
}

export class RollingTouchpointRequestConversionRateRangeRule implements RollingTouchpointRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTouchpointRequest): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingTouchpointRequestRequiredTitleRule implements RollingTouchpointRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingTouchpointRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingTouchpointRequestCountryLengthRule implements RollingTouchpointRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingTouchpointRequest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling touchpoint request. */
export class RollingTouchpointRequestValidator {
  rules: RollingTouchpointRequestRule[];

  constructor(rules: RollingTouchpointRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RollingTouchpointRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingTouchpointRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingTouchpointRequest[]): Map<string, string[]> {
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

export function defaultRollingTouchpointRequestValidator(): RollingTouchpointRequestValidator {
  return new RollingTouchpointRequestValidator(
    [
      new RollingTouchpointRequestConversionRateRangeRule(9.8, 194.4),
      new RollingTouchpointRequestRequiredTitleRule("rolling touchpoint request needs a value"),
      new RollingTouchpointRequestCountryLengthRule(64),
    ],
  );
}
