import * as text from "../../../../kit/text.js";
import { GlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

/** A rule a global subscription estimate must pass. Check returns its problems, or none. */
export interface GlobalSubscriptionEstimateRule {
  check(item: GlobalSubscriptionEstimate): string[];
}

export class GlobalSubscriptionEstimateConversionRateRangeRule implements GlobalSubscriptionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSubscriptionEstimate): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSubscriptionEstimateAllowedCodeRule implements GlobalSubscriptionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalSubscriptionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class GlobalSubscriptionEstimateCampaignRefLengthRule implements GlobalSubscriptionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSubscriptionEstimate): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSubscriptionEstimateExpiresAtRangeRule implements GlobalSubscriptionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSubscriptionEstimate): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalSubscriptionEstimateNameLengthRule implements GlobalSubscriptionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSubscriptionEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global subscription estimate. */
export class GlobalSubscriptionEstimateValidator {
  rules: GlobalSubscriptionEstimateRule[];

  constructor(rules: GlobalSubscriptionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSubscriptionEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSubscriptionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSubscriptionEstimate[]): Map<string, string[]> {
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

export function defaultGlobalSubscriptionEstimateValidator(): GlobalSubscriptionEstimateValidator {
  return new GlobalSubscriptionEstimateValidator(
    [
      new GlobalSubscriptionEstimateConversionRateRangeRule(7.3, 1367.5),
      new GlobalSubscriptionEstimateAllowedCodeRule(["seasonal"]),
      new GlobalSubscriptionEstimateCampaignRefLengthRule(80),
      new GlobalSubscriptionEstimateExpiresAtRangeRule(80, 255),
      new GlobalSubscriptionEstimateNameLengthRule(80),
    ],
  );
}
