import * as text from "../../../../kit/text.js";
import { TieredSlaMapping } from "./tiered-sla-mapping.js";

/** A rule a tiered sla mapping must pass. Check returns its problems, or none. */
export interface TieredSlaMappingRule {
  check(item: TieredSlaMapping): string[];
}

export class TieredSlaMappingLocaleLengthRule implements TieredSlaMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSlaMapping): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredSlaMappingAllowedCodeRule implements TieredSlaMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredSlaMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class TieredSlaMappingBudgetRangeRule implements TieredSlaMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSlaMapping): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredSlaMappingTitleLengthRule implements TieredSlaMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSlaMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered sla mapping. */
export class TieredSlaMappingValidator {
  rules: TieredSlaMappingRule[];

  constructor(rules: TieredSlaMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSlaMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredSlaMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSlaMapping[]): Map<string, string[]> {
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

export function defaultTieredSlaMappingValidator(): TieredSlaMappingValidator {
  return new TieredSlaMappingValidator(
    [
      new TieredSlaMappingLocaleLengthRule(120),
      new TieredSlaMappingAllowedCodeRule(["strict"]),
      new TieredSlaMappingBudgetRangeRule(6.6, 4128.9),
      new TieredSlaMappingTitleLengthRule(255),
    ],
  );
}
