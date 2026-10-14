import * as text from "../../../../kit/text.js";
import { SubscriptionEstimate } from "./subscription-estimate.js";

/** A rule a subscription estimate must pass. Check returns its problems, or none. */
export interface SubscriptionEstimateRule {
  check(item: SubscriptionEstimate): string[];
}

export class SubscriptionEstimateRequiredSummaryRule implements SubscriptionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionEstimate): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionEstimateAllowedCodeRule implements SubscriptionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class SubscriptionEstimateRequiredAudienceIdRule implements SubscriptionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionEstimate): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionEstimateCodePrefixRule implements SubscriptionEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionEstimateRequiredNameRule implements SubscriptionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionEstimatePriorityRangeRule implements SubscriptionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionEstimate): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a subscription estimate. */
export class SubscriptionEstimateValidator {
  rules: SubscriptionEstimateRule[];

  constructor(rules: SubscriptionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionEstimate[]): Map<string, string[]> {
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

export function defaultSubscriptionEstimateValidator(): SubscriptionEstimateValidator {
  return new SubscriptionEstimateValidator(
    [
      new SubscriptionEstimateRequiredSummaryRule("subscription estimate needs this field"),
      new SubscriptionEstimateAllowedCodeRule(["global"]),
      new SubscriptionEstimateRequiredAudienceIdRule("subscription estimate needs an entry"),
      new SubscriptionEstimateCodePrefixRule("X"),
      new SubscriptionEstimateRequiredNameRule("subscription estimate needs this field"),
      new SubscriptionEstimatePriorityRangeRule(16, 86400),
    ],
  );
}
