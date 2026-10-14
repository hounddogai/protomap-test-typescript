import * as text from "../../../../kit/text.js";
import { WeightedFraudCheckException } from "./weighted-fraud-check-exception.js";

/** A rule a weighted fraud check exception must pass. Check returns its problems, or none. */
export interface WeightedFraudCheckExceptionRule {
  check(item: WeightedFraudCheckException): string[];
}

export class WeightedFraudCheckExceptionCodePrefixRule implements WeightedFraudCheckExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedFraudCheckException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedFraudCheckExceptionRequiredTitleRule implements WeightedFraudCheckExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFraudCheckException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedFraudCheckExceptionAllowedTitleRule implements WeightedFraudCheckExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedFraudCheckException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class WeightedFraudCheckExceptionTitleLengthRule implements WeightedFraudCheckExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFraudCheckException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted fraud check exception. */
export class WeightedFraudCheckExceptionValidator {
  rules: WeightedFraudCheckExceptionRule[];

  constructor(rules: WeightedFraudCheckExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFraudCheckException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedFraudCheckException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFraudCheckException[]): Map<string, string[]> {
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

export function defaultWeightedFraudCheckExceptionValidator(): WeightedFraudCheckExceptionValidator {
  return new WeightedFraudCheckExceptionValidator(
    [
      new WeightedFraudCheckExceptionCodePrefixRule("ACM"),
      new WeightedFraudCheckExceptionRequiredTitleRule("weighted fraud check exception needs this field"),
      new WeightedFraudCheckExceptionAllowedTitleRule(["fallback", "legacy"]),
      new WeightedFraudCheckExceptionTitleLengthRule(80),
    ],
  );
}
