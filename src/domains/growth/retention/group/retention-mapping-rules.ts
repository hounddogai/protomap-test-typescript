import * as text from "../../../../kit/text.js";
import { RetentionMapping } from "./retention-mapping.js";

/** A rule a retention mapping must pass. Check returns its problems, or none. */
export interface RetentionMappingRule {
  check(item: RetentionMapping): string[];
}

export class RetentionMappingRequiredTitleRule implements RetentionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionMappingCostRangeRule implements RetentionMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionMapping): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionMappingCodeLengthRule implements RetentionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionMappingRequiredVariantRule implements RetentionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionMapping): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionMappingAllowedLocaleRule implements RetentionMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is not allowed`];
    return [];
  }
}

/** Runs every rule of a retention mapping. */
export class RetentionMappingValidator {
  rules: RetentionMappingRule[];

  constructor(rules: RetentionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionMapping): string[] {
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

  requireValid(item: RetentionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionMapping[]): Map<string, string[]> {
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

export function defaultRetentionMappingValidator(): RetentionMappingValidator {
  return new RetentionMappingValidator(
    [
      new RetentionMappingRequiredTitleRule("retention mapping needs a value"),
      new RetentionMappingCostRangeRule(7.5, 241.5),
      new RetentionMappingCodeLengthRule(16),
      new RetentionMappingRequiredVariantRule("retention mapping needs this field"),
      new RetentionMappingAllowedLocaleRule([]),
    ],
  );
}
