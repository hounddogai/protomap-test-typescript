import { RollingRedemptionVariance } from "./rolling-redemption-variance.js";

/** A rule a rolling redemption variance must pass. Check returns its problems, or none. */
export interface RollingRedemptionVarianceRule {
  check(item: RollingRedemptionVariance): string[];
}

export class RollingRedemptionVarianceRequiredSourceRule implements RollingRedemptionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRedemptionVariance): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRedemptionVarianceCodeLengthRule implements RollingRedemptionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRedemptionVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingRedemptionVarianceVersionRangeRule implements RollingRedemptionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingRedemptionVariance): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingRedemptionVarianceCodePrefixRule implements RollingRedemptionVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingRedemptionVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling redemption variance. */
export class RollingRedemptionVarianceValidator {
  rules: RollingRedemptionVarianceRule[];

  constructor(rules: RollingRedemptionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingRedemptionVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingRedemptionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingRedemptionVariance[]): Map<string, string[]> {
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

export function defaultRollingRedemptionVarianceValidator(): RollingRedemptionVarianceValidator {
  return new RollingRedemptionVarianceValidator(
    [
      new RollingRedemptionVarianceRequiredSourceRule("rolling redemption variance needs a value"),
      new RollingRedemptionVarianceCodeLengthRule(1000),
      new RollingRedemptionVarianceVersionRangeRule(80, 86400),
      new RollingRedemptionVarianceCodePrefixRule("OPS"),
    ],
  );
}
