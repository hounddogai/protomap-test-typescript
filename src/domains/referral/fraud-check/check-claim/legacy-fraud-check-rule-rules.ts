import * as text from "../../../../kit/text.js";
import { LegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

/** A rule a legacy fraud check rule must pass. Check returns its problems, or none. */
export interface LegacyFraudCheckRuleRule {
  check(item: LegacyFraudCheckRule): string[];
}

export class LegacyFraudCheckRuleRequiredDescriptionRule implements LegacyFraudCheckRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFraudCheckRule): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFraudCheckRuleRequiredContactEmailRule implements LegacyFraudCheckRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFraudCheckRule): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFraudCheckRuleContactEmailLengthRule implements LegacyFraudCheckRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFraudCheckRule): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFraudCheckRuleAllowedTitleRule implements LegacyFraudCheckRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyFraudCheckRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class LegacyFraudCheckRuleCeilingRangeRule implements LegacyFraudCheckRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFraudCheckRule): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy fraud check rule. */
export class LegacyFraudCheckRuleValidator {
  rules: LegacyFraudCheckRuleRule[];

  constructor(rules: LegacyFraudCheckRuleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFraudCheckRule): string[] {
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

  requireValid(item: LegacyFraudCheckRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFraudCheckRule[]): Map<string, string[]> {
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

export function defaultLegacyFraudCheckRuleValidator(): LegacyFraudCheckRuleValidator {
  return new LegacyFraudCheckRuleValidator(
    [
      new LegacyFraudCheckRuleRequiredDescriptionRule("legacy fraud check rule needs a value"),
      new LegacyFraudCheckRuleRequiredContactEmailRule("legacy fraud check rule needs a value"),
      new LegacyFraudCheckRuleContactEmailLengthRule(120),
      new LegacyFraudCheckRuleAllowedTitleRule(["adaptive", "batched"]),
      new LegacyFraudCheckRuleCeilingRangeRule(0.7, 581.5),
    ],
  );
}
