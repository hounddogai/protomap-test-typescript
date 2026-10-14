import * as text from "../../../../kit/text.js";
import { FallbackBidRuleWindow } from "./fallback-bid-rule-window.js";

/** A rule a fallback bid rule window must pass. Check returns its problems, or none. */
export interface FallbackBidRuleWindowRule {
  check(item: FallbackBidRuleWindow): string[];
}

export class FallbackBidRuleWindowAllowedCodeRule implements FallbackBidRuleWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackBidRuleWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class FallbackBidRuleWindowAudienceIdLengthRule implements FallbackBidRuleWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRuleWindow): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBidRuleWindowCodeLengthRule implements FallbackBidRuleWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRuleWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBidRuleWindowWindowDaysRangeRule implements FallbackBidRuleWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBidRuleWindow): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback bid rule window. */
export class FallbackBidRuleWindowValidator {
  rules: FallbackBidRuleWindowRule[];

  constructor(rules: FallbackBidRuleWindowRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBidRuleWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackBidRuleWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBidRuleWindow[]): Map<string, string[]> {
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

export function defaultFallbackBidRuleWindowValidator(): FallbackBidRuleWindowValidator {
  return new FallbackBidRuleWindowValidator(
    [
      new FallbackBidRuleWindowAllowedCodeRule([]),
      new FallbackBidRuleWindowAudienceIdLengthRule(3600),
      new FallbackBidRuleWindowCodeLengthRule(120),
      new FallbackBidRuleWindowWindowDaysRangeRule(120, 1000),
    ],
  );
}
