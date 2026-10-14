import { FraudCheckWindow } from "./fraud-check-window.js";

/** A rule a fraud check window must pass. Check returns its problems, or none. */
export interface FraudCheckWindowRule {
  check(item: FraudCheckWindow): string[];
}

export class FraudCheckWindowNameLengthRule implements FraudCheckWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckWindowConversionRateRangeRule implements FraudCheckWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckWindow): string[] {
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

export class FraudCheckWindowCodePrefixRule implements FraudCheckWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckWindowCampaignRefLengthRule implements FraudCheckWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckWindow): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckWindowCodeLengthRule implements FraudCheckWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check window. */
export class FraudCheckWindowValidator {
  rules: FraudCheckWindowRule[];

  constructor(rules: FraudCheckWindowRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckWindow): string[] {
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

  requireValid(item: FraudCheckWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckWindow[]): Map<string, string[]> {
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

export function defaultFraudCheckWindowValidator(): FraudCheckWindowValidator {
  return new FraudCheckWindowValidator(
    [
      new FraudCheckWindowNameLengthRule(3600),
      new FraudCheckWindowConversionRateRangeRule(1.2, 841.8),
      new FraudCheckWindowCodePrefixRule("Q"),
      new FraudCheckWindowCampaignRefLengthRule(1000),
      new FraudCheckWindowCodeLengthRule(16),
    ],
  );
}
