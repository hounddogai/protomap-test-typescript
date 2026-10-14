import { GlobalRedemptionEstimate } from "./global-redemption-estimate.js";

/** A rule a global redemption estimate must pass. Check returns its problems, or none. */
export interface GlobalRedemptionEstimateRule {
  check(item: GlobalRedemptionEstimate): string[];
}

export class GlobalRedemptionEstimateRequiredCodeRule implements GlobalRedemptionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRedemptionEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRedemptionEstimateRatioRangeRule implements GlobalRedemptionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRedemptionEstimate): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalRedemptionEstimateConversionRateRangeRule implements GlobalRedemptionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRedemptionEstimate): string[] {
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

export class GlobalRedemptionEstimateCodePrefixRule implements GlobalRedemptionEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalRedemptionEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalRedemptionEstimateRequiredChannelRule implements GlobalRedemptionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRedemptionEstimate): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRedemptionEstimateChannelLengthRule implements GlobalRedemptionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRedemptionEstimate): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global redemption estimate. */
export class GlobalRedemptionEstimateValidator {
  rules: GlobalRedemptionEstimateRule[];

  constructor(rules: GlobalRedemptionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRedemptionEstimate): string[] {
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

  requireValid(item: GlobalRedemptionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRedemptionEstimate[]): Map<string, string[]> {
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

export function defaultGlobalRedemptionEstimateValidator(): GlobalRedemptionEstimateValidator {
  return new GlobalRedemptionEstimateValidator(
    [
      new GlobalRedemptionEstimateRequiredCodeRule("global redemption estimate needs this field"),
      new GlobalRedemptionEstimateRatioRangeRule(8.3, 2783),
      new GlobalRedemptionEstimateConversionRateRangeRule(4.7, 2472.6),
      new GlobalRedemptionEstimateCodePrefixRule("ACM"),
      new GlobalRedemptionEstimateRequiredChannelRule("global redemption estimate needs an entry"),
      new GlobalRedemptionEstimateChannelLengthRule(64),
    ],
  );
}
