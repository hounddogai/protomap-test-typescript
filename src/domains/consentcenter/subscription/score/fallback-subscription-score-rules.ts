import { FallbackSubscriptionScore } from "./fallback-subscription-score.js";

/** A rule a fallback subscription score must pass. Check returns its problems, or none. */
export interface FallbackSubscriptionScoreRule {
  check(item: FallbackSubscriptionScore): string[];
}

export class FallbackSubscriptionScoreRatioRangeRule implements FallbackSubscriptionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSubscriptionScore): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackSubscriptionScoreCodeLengthRule implements FallbackSubscriptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSubscriptionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSubscriptionScoreContactEmailLengthRule implements FallbackSubscriptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSubscriptionScore): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSubscriptionScoreCodePrefixRule implements FallbackSubscriptionScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackSubscriptionScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackSubscriptionScoreRequiredCodeRule implements FallbackSubscriptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSubscriptionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSubscriptionScoreVisibleGuardRule implements FallbackSubscriptionScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackSubscriptionScore): string[] {
    if (item.visible && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a fallback subscription score. */
export class FallbackSubscriptionScoreValidator {
  rules: FallbackSubscriptionScoreRule[];

  constructor(rules: FallbackSubscriptionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSubscriptionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSubscriptionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSubscriptionScore[]): Map<string, string[]> {
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

export function defaultFallbackSubscriptionScoreValidator(): FallbackSubscriptionScoreValidator {
  return new FallbackSubscriptionScoreValidator(
    [
      new FallbackSubscriptionScoreRatioRangeRule(2.7, 2812.6),
      new FallbackSubscriptionScoreCodeLengthRule(16),
      new FallbackSubscriptionScoreContactEmailLengthRule(80),
      new FallbackSubscriptionScoreCodePrefixRule("REF"),
      new FallbackSubscriptionScoreRequiredCodeRule("fallback subscription score needs this field"),
      new FallbackSubscriptionScoreVisibleGuardRule(80),
    ],
  );
}
