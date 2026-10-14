import * as text from "../../../../kit/text.js";
import { FallbackInsightException } from "./fallback-insight-exception.js";

/** A rule a fallback insight exception must pass. Check returns its problems, or none. */
export interface FallbackInsightExceptionRule {
  check(item: FallbackInsightException): string[];
}

export class FallbackInsightExceptionRequiredCodeRule implements FallbackInsightExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInsightExceptionCostRangeRule implements FallbackInsightExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackInsightException): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackInsightExceptionNameLengthRule implements FallbackInsightExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInsightException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackInsightExceptionAllowedNameRule implements FallbackInsightExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackInsightException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class FallbackInsightExceptionCodePrefixRule implements FallbackInsightExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackInsightException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback insight exception. */
export class FallbackInsightExceptionValidator {
  rules: FallbackInsightExceptionRule[];

  constructor(rules: FallbackInsightExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackInsightException): string[] {
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

  requireValid(item: FallbackInsightException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackInsightException[]): Map<string, string[]> {
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

export function defaultFallbackInsightExceptionValidator(): FallbackInsightExceptionValidator {
  return new FallbackInsightExceptionValidator(
    [
      new FallbackInsightExceptionRequiredCodeRule("fallback insight exception needs an entry"),
      new FallbackInsightExceptionCostRangeRule(1.1, 1536.5),
      new FallbackInsightExceptionNameLengthRule(3600),
      new FallbackInsightExceptionAllowedNameRule(["manual", "global"]),
      new FallbackInsightExceptionCodePrefixRule("Q"),
    ],
  );
}
