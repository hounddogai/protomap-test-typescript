import { DefaultRedemptionVariance } from "./default-redemption-variance.js";

/** A rule a default redemption variance must pass. Check returns its problems, or none. */
export interface DefaultRedemptionVarianceRule {
  check(item: DefaultRedemptionVariance): string[];
}

export class DefaultRedemptionVarianceCodePrefixRule implements DefaultRedemptionVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultRedemptionVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultRedemptionVarianceRequiredCodeRule implements DefaultRedemptionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRedemptionVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRedemptionVarianceLimitRangeRule implements DefaultRedemptionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRedemptionVariance): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultRedemptionVarianceRequiredLocaleRule implements DefaultRedemptionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRedemptionVariance): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default redemption variance. */
export class DefaultRedemptionVarianceValidator {
  rules: DefaultRedemptionVarianceRule[];

  constructor(rules: DefaultRedemptionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRedemptionVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultRedemptionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRedemptionVariance[]): Map<string, string[]> {
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

export function defaultDefaultRedemptionVarianceValidator(): DefaultRedemptionVarianceValidator {
  return new DefaultRedemptionVarianceValidator(
    [
      new DefaultRedemptionVarianceCodePrefixRule("REF"),
      new DefaultRedemptionVarianceRequiredCodeRule("default redemption variance needs this field"),
      new DefaultRedemptionVarianceLimitRangeRule(255, 3600),
      new DefaultRedemptionVarianceRequiredLocaleRule("default redemption variance needs an entry"),
    ],
  );
}
