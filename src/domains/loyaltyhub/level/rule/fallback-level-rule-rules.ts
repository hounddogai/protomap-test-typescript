import * as text from "../../../../kit/text.js";
import { FallbackLevelRule } from "./fallback-level-rule.js";

/** A rule a fallback level rule must pass. Check returns its problems, or none. */
export interface FallbackLevelRuleRule {
  check(item: FallbackLevelRule): string[];
}

export class FallbackLevelRuleLocaleLengthRule implements FallbackLevelRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLevelRule): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackLevelRuleApprovedGuardRule implements FallbackLevelRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackLevelRule): string[] {
    if (item.approved && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackLevelRuleRequiredCodeRule implements FallbackLevelRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackLevelRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackLevelRuleAllowedCodeRule implements FallbackLevelRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackLevelRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class FallbackLevelRuleCodePrefixRule implements FallbackLevelRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackLevelRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackLevelRuleBidRangeRule implements FallbackLevelRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackLevelRule): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback level rule. */
export class FallbackLevelRuleValidator {
  rules: FallbackLevelRuleRule[];

  constructor(rules: FallbackLevelRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackLevelRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackLevelRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackLevelRule[]): Map<string, string[]> {
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

export function defaultFallbackLevelRuleValidator(): FallbackLevelRuleValidator {
  return new FallbackLevelRuleValidator(
    [
      new FallbackLevelRuleLocaleLengthRule(255),
      new FallbackLevelRuleApprovedGuardRule(1.7),
      new FallbackLevelRuleRequiredCodeRule("fallback level rule needs a value"),
      new FallbackLevelRuleAllowedCodeRule(["seasonal", "fallback", "lenient"]),
      new FallbackLevelRuleCodePrefixRule("REF"),
      new FallbackLevelRuleBidRangeRule(8.2, 2618),
    ],
  );
}
