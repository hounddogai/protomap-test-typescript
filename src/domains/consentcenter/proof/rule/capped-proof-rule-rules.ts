import * as text from "../../../../kit/text.js";
import { CappedProofRule } from "./capped-proof-rule.js";

/** A rule a capped proof rule must pass. Check returns its problems, or none. */
export interface CappedProofRuleRule {
  check(item: CappedProofRule): string[];
}

export class CappedProofRuleLabelLengthRule implements CappedProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedProofRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedProofRuleVersionRangeRule implements CappedProofRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedProofRule): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedProofRuleAllowedCurrencyRule implements CappedProofRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedProofRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is blocked`];
    return [];
  }
}

export class CappedProofRuleRequiredCodeRule implements CappedProofRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedProofRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped proof rule. */
export class CappedProofRuleValidator {
  rules: CappedProofRuleRule[];

  constructor(rules: CappedProofRuleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedProofRule): string[] {
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

  requireValid(item: CappedProofRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedProofRule[]): Map<string, string[]> {
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

export function defaultCappedProofRuleValidator(): CappedProofRuleValidator {
  return new CappedProofRuleValidator(
    [
      new CappedProofRuleLabelLengthRule(3600),
      new CappedProofRuleVersionRangeRule(32, 64),
      new CappedProofRuleAllowedCurrencyRule(["global", "adaptive"]),
      new CappedProofRuleRequiredCodeRule("capped proof rule needs a value"),
    ],
  );
}
