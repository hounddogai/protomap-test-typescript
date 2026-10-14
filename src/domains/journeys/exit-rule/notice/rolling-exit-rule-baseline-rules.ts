import * as text from "../../../../kit/text.js";
import { RollingExitRuleBaseline } from "./rolling-exit-rule-baseline.js";

/** A rule a rolling exit rule baseline must pass. Check returns its problems, or none. */
export interface RollingExitRuleBaselineRule {
  check(item: RollingExitRuleBaseline): string[];
}

export class RollingExitRuleBaselineVersionRangeRule implements RollingExitRuleBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingExitRuleBaseline): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingExitRuleBaselineAllowedCodeRule implements RollingExitRuleBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingExitRuleBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class RollingExitRuleBaselineNameLengthRule implements RollingExitRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingExitRuleBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling exit rule baseline. */
export class RollingExitRuleBaselineValidator {
  rules: RollingExitRuleBaselineRule[];

  constructor(rules: RollingExitRuleBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RollingExitRuleBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingExitRuleBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingExitRuleBaseline[]): Map<string, string[]> {
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

export function defaultRollingExitRuleBaselineValidator(): RollingExitRuleBaselineValidator {
  return new RollingExitRuleBaselineValidator(
    [
      new RollingExitRuleBaselineVersionRangeRule(120, 120),
      new RollingExitRuleBaselineAllowedCodeRule([]),
      new RollingExitRuleBaselineNameLengthRule(86400),
    ],
  );
}
