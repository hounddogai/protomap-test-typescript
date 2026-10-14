import { PrimaryFlightPolicy } from "./primary-flight-policy.js";

/** A rule a primary flight policy must pass. Check returns its problems, or none. */
export interface PrimaryFlightPolicyRule {
  check(item: PrimaryFlightPolicy): string[];
}

export class PrimaryFlightPolicyChannelLengthRule implements PrimaryFlightPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFlightPolicy): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFlightPolicyCodePrefixRule implements PrimaryFlightPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryFlightPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryFlightPolicyRateRangeRule implements PrimaryFlightPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFlightPolicy): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryFlightPolicyRequiredCodeRule implements PrimaryFlightPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFlightPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary flight policy. */
export class PrimaryFlightPolicyValidator {
  rules: PrimaryFlightPolicyRule[];

  constructor(rules: PrimaryFlightPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFlightPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryFlightPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFlightPolicy[]): Map<string, string[]> {
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

export function defaultPrimaryFlightPolicyValidator(): PrimaryFlightPolicyValidator {
  return new PrimaryFlightPolicyValidator(
    [
      new PrimaryFlightPolicyChannelLengthRule(86400),
      new PrimaryFlightPolicyCodePrefixRule("OPS"),
      new PrimaryFlightPolicyRateRangeRule(7.5, 566.4),
      new PrimaryFlightPolicyRequiredCodeRule("primary flight policy needs this field"),
    ],
  );
}
