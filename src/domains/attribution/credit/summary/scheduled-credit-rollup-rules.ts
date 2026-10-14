import * as text from "../../../../kit/text.js";
import { ScheduledCreditRollup } from "./scheduled-credit-rollup.js";

/** A rule a scheduled credit rollup must pass. Check returns its problems, or none. */
export interface ScheduledCreditRollupRule {
  check(item: ScheduledCreditRollup): string[];
}

export class ScheduledCreditRollupQuantityRangeRule implements ScheduledCreditRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreditRollup): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledCreditRollupAllowedCodeRule implements ScheduledCreditRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledCreditRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class ScheduledCreditRollupImpressionsRangeRule implements ScheduledCreditRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreditRollup): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledCreditRollupRequiredCodeRule implements ScheduledCreditRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreditRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCreditRollupFrequencyCapRangeRule implements ScheduledCreditRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreditRollup): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledCreditRollupTitleLengthRule implements ScheduledCreditRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCreditRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled credit rollup. */
export class ScheduledCreditRollupValidator {
  rules: ScheduledCreditRollupRule[];

  constructor(rules: ScheduledCreditRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCreditRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCreditRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCreditRollup[]): Map<string, string[]> {
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

export function defaultScheduledCreditRollupValidator(): ScheduledCreditRollupValidator {
  return new ScheduledCreditRollupValidator(
    [
      new ScheduledCreditRollupQuantityRangeRule(120, 1000),
      new ScheduledCreditRollupAllowedCodeRule(["legacy", "weighted", "adaptive"]),
      new ScheduledCreditRollupImpressionsRangeRule(120, 1000),
      new ScheduledCreditRollupRequiredCodeRule("scheduled credit rollup needs an entry"),
      new ScheduledCreditRollupFrequencyCapRangeRule(255, 86400),
      new ScheduledCreditRollupTitleLengthRule(3600),
    ],
  );
}
