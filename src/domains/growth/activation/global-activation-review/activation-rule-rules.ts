import * as text from "../../../../kit/text.js";
import { ActivationRule } from "./activation-rule.js";

/** A rule a activation rule must pass. Check returns its problems, or none. */
export interface ActivationRuleRule {
  check(item: ActivationRule): string[];
}

export class ActivationRuleTitleLengthRule implements ActivationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationRuleRequiredCodeRule implements ActivationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationRuleAllowedCodeRule implements ActivationRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class ActivationRuleSequenceRangeRule implements ActivationRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationRule): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a activation rule. */
export class ActivationRuleValidator {
  rules: ActivationRuleRule[];

  constructor(rules: ActivationRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationRule[]): Map<string, string[]> {
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

export function defaultActivationRuleValidator(): ActivationRuleValidator {
  return new ActivationRuleValidator(
    [
      new ActivationRuleTitleLengthRule(32),
      new ActivationRuleRequiredCodeRule("activation rule needs an entry"),
      new ActivationRuleAllowedCodeRule(["lenient"]),
      new ActivationRuleSequenceRangeRule(32, 120),
    ],
  );
}
