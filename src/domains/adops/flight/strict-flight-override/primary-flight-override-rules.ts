import { PrimaryFlightOverride } from "./primary-flight-override.js";

/** A rule a primary flight override must pass. Check returns its problems, or none. */
export interface PrimaryFlightOverrideRule {
  check(item: PrimaryFlightOverride): string[];
}

export class PrimaryFlightOverrideRequiredVariantRule implements PrimaryFlightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFlightOverride): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFlightOverrideRequiredCodeRule implements PrimaryFlightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFlightOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFlightOverrideConversionRateRangeRule implements PrimaryFlightOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFlightOverride): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryFlightOverrideVariantLengthRule implements PrimaryFlightOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFlightOverride): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary flight override. */
export class PrimaryFlightOverrideValidator {
  rules: PrimaryFlightOverrideRule[];

  constructor(rules: PrimaryFlightOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFlightOverride): string[] {
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

  requireValid(item: PrimaryFlightOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFlightOverride[]): Map<string, string[]> {
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

export function defaultPrimaryFlightOverrideValidator(): PrimaryFlightOverrideValidator {
  return new PrimaryFlightOverrideValidator(
    [
      new PrimaryFlightOverrideRequiredVariantRule("primary flight override needs a value"),
      new PrimaryFlightOverrideRequiredCodeRule("primary flight override needs an entry"),
      new PrimaryFlightOverrideConversionRateRangeRule(4.4, 2564.7),
      new PrimaryFlightOverrideVariantLengthRule(86400),
    ],
  );
}
