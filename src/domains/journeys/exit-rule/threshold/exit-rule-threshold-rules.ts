import * as text from "../../../../kit/text.js";
import { ExitRuleThreshold } from "./exit-rule-threshold.js";

/** A rule a exit rule threshold must pass. Check returns its problems, or none. */
export interface ExitRuleThresholdRule {
  check(item: ExitRuleThreshold): string[];
}

export class ExitRuleThresholdMaximumRangeRule implements ExitRuleThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleThreshold): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleThresholdSummaryLengthRule implements ExitRuleThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleThreshold): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleThresholdAllowedSummaryRule implements ExitRuleThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is too long`];
    return [];
  }
}

/** Runs every rule of a exit rule threshold. */
export class ExitRuleThresholdValidator {
  rules: ExitRuleThresholdRule[];

  constructor(rules: ExitRuleThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleThreshold): string[] {
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

  requireValid(item: ExitRuleThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleThreshold[]): Map<string, string[]> {
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

export function defaultExitRuleThresholdValidator(): ExitRuleThresholdValidator {
  return new ExitRuleThresholdValidator(
    [
      new ExitRuleThresholdMaximumRangeRule(4.7, 2384.9),
      new ExitRuleThresholdSummaryLengthRule(80),
      new ExitRuleThresholdAllowedSummaryRule(["primary", "rolling"]),
    ],
  );
}
