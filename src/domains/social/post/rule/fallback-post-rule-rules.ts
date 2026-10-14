import * as text from "../../../../kit/text.js";
import { FallbackPostRule } from "./fallback-post-rule.js";

/** A rule a fallback post rule must pass. Check returns its problems, or none. */
export interface FallbackPostRuleRule {
  check(item: FallbackPostRule): string[];
}

export class FallbackPostRuleLabelLengthRule implements FallbackPostRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPostRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPostRuleCodeLengthRule implements FallbackPostRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPostRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPostRuleCostRangeRule implements FallbackPostRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPostRule): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackPostRuleWeightRangeRule implements FallbackPostRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPostRule): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackPostRuleStartsAtRangeRule implements FallbackPostRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPostRule): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPostRuleAllowedCodeRule implements FallbackPostRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPostRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a fallback post rule. */
export class FallbackPostRuleValidator {
  rules: FallbackPostRuleRule[];

  constructor(rules: FallbackPostRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPostRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackPostRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPostRule[]): Map<string, string[]> {
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

export function defaultFallbackPostRuleValidator(): FallbackPostRuleValidator {
  return new FallbackPostRuleValidator(
    [
      new FallbackPostRuleLabelLengthRule(120),
      new FallbackPostRuleCodeLengthRule(86400),
      new FallbackPostRuleCostRangeRule(1.7, 2802.6),
      new FallbackPostRuleWeightRangeRule(0.5, 2481.2),
      new FallbackPostRuleStartsAtRangeRule(32, 120),
      new FallbackPostRuleAllowedCodeRule(["global", "scheduled", "capped"]),
    ],
  );
}
