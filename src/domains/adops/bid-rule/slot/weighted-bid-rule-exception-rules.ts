import { WeightedBidRuleException } from "./weighted-bid-rule-exception.js";

/** A rule a weighted bid rule exception must pass. Check returns its problems, or none. */
export interface WeightedBidRuleExceptionRule {
  check(item: WeightedBidRuleException): string[];
}

export class WeightedBidRuleExceptionCodePrefixRule implements WeightedBidRuleExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedBidRuleException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedBidRuleExceptionBidRangeRule implements WeightedBidRuleExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedBidRuleException): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedBidRuleExceptionRequiredTitleRule implements WeightedBidRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBidRuleException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBidRuleExceptionRequiredSourceRule implements WeightedBidRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBidRuleException): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBidRuleExceptionSourceLengthRule implements WeightedBidRuleExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedBidRuleException): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedBidRuleExceptionCapacityRangeRule implements WeightedBidRuleExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedBidRuleException): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted bid rule exception. */
export class WeightedBidRuleExceptionValidator {
  rules: WeightedBidRuleExceptionRule[];

  constructor(rules: WeightedBidRuleExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedBidRuleException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedBidRuleException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedBidRuleException[]): Map<string, string[]> {
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

export function defaultWeightedBidRuleExceptionValidator(): WeightedBidRuleExceptionValidator {
  return new WeightedBidRuleExceptionValidator(
    [
      new WeightedBidRuleExceptionCodePrefixRule("REF"),
      new WeightedBidRuleExceptionBidRangeRule(8.4, 4804.8),
      new WeightedBidRuleExceptionRequiredTitleRule("weighted bid rule exception needs this field"),
      new WeightedBidRuleExceptionRequiredSourceRule("weighted bid rule exception needs a value"),
      new WeightedBidRuleExceptionSourceLengthRule(32),
      new WeightedBidRuleExceptionCapacityRangeRule(32, 80),
    ],
  );
}
