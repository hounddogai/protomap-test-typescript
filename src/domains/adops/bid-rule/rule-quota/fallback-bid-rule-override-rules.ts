import * as text from "../../../../kit/text.js";
import { FallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

/** A rule a fallback bid rule override must pass. Check returns its problems, or none. */
export interface FallbackBidRuleOverrideRule {
  check(item: FallbackBidRuleOverride): string[];
}

export class FallbackBidRuleOverrideAllowedTimezoneRule implements FallbackBidRuleOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackBidRuleOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is blocked`];
    return [];
  }
}

export class FallbackBidRuleOverrideExpiresAtRangeRule implements FallbackBidRuleOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBidRuleOverride): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackBidRuleOverrideAttemptsRangeRule implements FallbackBidRuleOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBidRuleOverride): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback bid rule override. */
export class FallbackBidRuleOverrideValidator {
  rules: FallbackBidRuleOverrideRule[];

  constructor(rules: FallbackBidRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBidRuleOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackBidRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBidRuleOverride[]): Map<string, string[]> {
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

export function defaultFallbackBidRuleOverrideValidator(): FallbackBidRuleOverrideValidator {
  return new FallbackBidRuleOverrideValidator(
    [
      new FallbackBidRuleOverrideAllowedTimezoneRule(["scheduled", "batched", "weighted"]),
      new FallbackBidRuleOverrideExpiresAtRangeRule(32, 3600),
      new FallbackBidRuleOverrideAttemptsRangeRule(64, 80),
    ],
  );
}
