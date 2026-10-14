import * as text from "../../../../kit/text.js";
import { StreakRule } from "./streak-rule.js";

/** A rule a streak rule must pass. Check returns its problems, or none. */
export interface StreakRuleRule {
  check(item: StreakRule): string[];
}

export class StreakRuleAllowedLabelRule implements StreakRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class StreakRuleMarginRangeRule implements StreakRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakRule): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakRuleRequiredLabelRule implements StreakRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StreakRuleMaximumRangeRule implements StreakRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakRule): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakRuleLabelLengthRule implements StreakRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak rule. */
export class StreakRuleValidator {
  rules: StreakRuleRule[];

  constructor(rules: StreakRuleRule[]) {
    this.rules = rules;
  }

  validate(item: StreakRule): string[] {
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

  requireValid(item: StreakRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakRule[]): Map<string, string[]> {
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

export function defaultStreakRuleValidator(): StreakRuleValidator {
  return new StreakRuleValidator(
    [
      new StreakRuleAllowedLabelRule(["scheduled", "capped"]),
      new StreakRuleMarginRangeRule(0.7, 230),
      new StreakRuleRequiredLabelRule("streak rule needs a value"),
      new StreakRuleMaximumRangeRule(4.5, 1561.2),
      new StreakRuleLabelLengthRule(255),
    ],
  );
}
