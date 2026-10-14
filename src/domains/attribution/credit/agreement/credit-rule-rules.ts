import * as text from "../../../../kit/text.js";
import { CreditRule } from "./credit-rule.js";

/** A rule a credit rule must pass. Check returns its problems, or none. */
export interface CreditRuleRule {
  check(item: CreditRule): string[];
}

export class CreditRuleAllowedCodeRule implements CreditRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class CreditRuleAudienceIdLengthRule implements CreditRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditRule): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditRuleDurationMinutesRangeRule implements CreditRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditRule): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditRuleRequiredContactEmailRule implements CreditRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditRule): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class CreditRuleCodeLengthRule implements CreditRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit rule. */
export class CreditRuleValidator {
  rules: CreditRuleRule[];

  constructor(rules: CreditRuleRule[]) {
    this.rules = rules;
  }

  validate(item: CreditRule): string[] {
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

  requireValid(item: CreditRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditRule[]): Map<string, string[]> {
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

export function defaultCreditRuleValidator(): CreditRuleValidator {
  return new CreditRuleValidator(
    [
      new CreditRuleAllowedCodeRule(["legacy", "pending", "default"]),
      new CreditRuleAudienceIdLengthRule(16),
      new CreditRuleDurationMinutesRangeRule(64, 80),
      new CreditRuleRequiredContactEmailRule("credit rule needs this field"),
      new CreditRuleCodeLengthRule(1000),
    ],
  );
}
