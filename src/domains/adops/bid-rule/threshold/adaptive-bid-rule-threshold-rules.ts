import { AdaptiveBidRuleThreshold } from "./adaptive-bid-rule-threshold.js";

/** A rule a adaptive bid rule threshold must pass. Check returns its problems, or none. */
export interface AdaptiveBidRuleThresholdRule {
  check(item: AdaptiveBidRuleThreshold): string[];
}

export class AdaptiveBidRuleThresholdArchivedGuardRule implements AdaptiveBidRuleThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveBidRuleThreshold): string[] {
    if (item.archived && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class AdaptiveBidRuleThresholdRequiredLabelRule implements AdaptiveBidRuleThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBidRuleThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBidRuleThresholdOpenRateRangeRule implements AdaptiveBidRuleThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBidRuleThreshold): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveBidRuleThresholdSourceLengthRule implements AdaptiveBidRuleThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBidRuleThreshold): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive bid rule threshold. */
export class AdaptiveBidRuleThresholdValidator {
  rules: AdaptiveBidRuleThresholdRule[];

  constructor(rules: AdaptiveBidRuleThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBidRuleThreshold): string[] {
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

  requireValid(item: AdaptiveBidRuleThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBidRuleThreshold[]): Map<string, string[]> {
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

export function defaultAdaptiveBidRuleThresholdValidator(): AdaptiveBidRuleThresholdValidator {
  return new AdaptiveBidRuleThresholdValidator(
    [
      new AdaptiveBidRuleThresholdArchivedGuardRule(32),
      new AdaptiveBidRuleThresholdRequiredLabelRule("adaptive bid rule threshold needs a value"),
      new AdaptiveBidRuleThresholdOpenRateRangeRule(0.1, 1227.1),
      new AdaptiveBidRuleThresholdSourceLengthRule(16),
    ],
  );
}
