import * as text from "../../../../kit/text.js";
import { WeightedCsatRule } from "./weighted-csat-rule.js";

/** A rule a weighted csat rule must pass. Check returns its problems, or none. */
export interface WeightedCsatRuleRule {
  check(item: WeightedCsatRule): string[];
}

export class WeightedCsatRuleRequiredCountryRule implements WeightedCsatRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCsatRule): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCsatRuleAllowedNameRule implements WeightedCsatRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedCsatRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class WeightedCsatRuleCodeLengthRule implements WeightedCsatRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCsatRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCsatRuleExpiresAtRangeRule implements WeightedCsatRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCsatRule): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedCsatRuleRetriesRangeRule implements WeightedCsatRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCsatRule): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedCsatRuleNotesLengthRule implements WeightedCsatRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCsatRule): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted csat rule. */
export class WeightedCsatRuleValidator {
  rules: WeightedCsatRuleRule[];

  constructor(rules: WeightedCsatRuleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCsatRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedCsatRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCsatRule[]): Map<string, string[]> {
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

export function defaultWeightedCsatRuleValidator(): WeightedCsatRuleValidator {
  return new WeightedCsatRuleValidator(
    [
      new WeightedCsatRuleRequiredCountryRule("weighted csat rule needs a value"),
      new WeightedCsatRuleAllowedNameRule(["pending", "capped"]),
      new WeightedCsatRuleCodeLengthRule(32),
      new WeightedCsatRuleExpiresAtRangeRule(16, 86400),
      new WeightedCsatRuleRetriesRangeRule(32, 86400),
      new WeightedCsatRuleNotesLengthRule(255),
    ],
  );
}
