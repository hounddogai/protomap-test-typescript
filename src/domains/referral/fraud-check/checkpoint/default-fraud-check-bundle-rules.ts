import { DefaultFraudCheckBundle } from "./default-fraud-check-bundle.js";

/** A rule a default fraud check bundle must pass. Check returns its problems, or none. */
export interface DefaultFraudCheckBundleRule {
  check(item: DefaultFraudCheckBundle): string[];
}

export class DefaultFraudCheckBundleCodeLengthRule implements DefaultFraudCheckBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFraudCheckBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFraudCheckBundleRequiredVariantRule implements DefaultFraudCheckBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFraudCheckBundle): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFraudCheckBundleCodePrefixRule implements DefaultFraudCheckBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFraudCheckBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultFraudCheckBundleBidRangeRule implements DefaultFraudCheckBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFraudCheckBundle): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default fraud check bundle. */
export class DefaultFraudCheckBundleValidator {
  rules: DefaultFraudCheckBundleRule[];

  constructor(rules: DefaultFraudCheckBundleRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFraudCheckBundle): string[] {
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

  requireValid(item: DefaultFraudCheckBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFraudCheckBundle[]): Map<string, string[]> {
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

export function defaultDefaultFraudCheckBundleValidator(): DefaultFraudCheckBundleValidator {
  return new DefaultFraudCheckBundleValidator(
    [
      new DefaultFraudCheckBundleCodeLengthRule(80),
      new DefaultFraudCheckBundleRequiredVariantRule("default fraud check bundle needs a value"),
      new DefaultFraudCheckBundleCodePrefixRule("ACM"),
      new DefaultFraudCheckBundleBidRangeRule(4.9, 4659.5),
    ],
  );
}
