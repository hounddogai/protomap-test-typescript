import * as text from "../../../../kit/text.js";
import { ScheduledFraudCheckRule } from "./scheduled-fraud-check-rule.js";

/** A rule a scheduled fraud check rule must pass. Check returns its problems, or none. */
export interface ScheduledFraudCheckRuleRule {
  check(item: ScheduledFraudCheckRule): string[];
}

export class ScheduledFraudCheckRuleNameLengthRule implements ScheduledFraudCheckRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFraudCheckRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFraudCheckRuleCurrencyLengthRule implements ScheduledFraudCheckRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFraudCheckRule): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFraudCheckRuleAmountRangeRule implements ScheduledFraudCheckRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFraudCheckRule): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledFraudCheckRuleAllowedNameRule implements ScheduledFraudCheckRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledFraudCheckRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class ScheduledFraudCheckRuleCodeLengthRule implements ScheduledFraudCheckRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFraudCheckRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFraudCheckRuleAudienceIdLengthRule implements ScheduledFraudCheckRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFraudCheckRule): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled fraud check rule. */
export class ScheduledFraudCheckRuleValidator {
  rules: ScheduledFraudCheckRuleRule[];

  constructor(rules: ScheduledFraudCheckRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFraudCheckRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledFraudCheckRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFraudCheckRule[]): Map<string, string[]> {
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

export function defaultScheduledFraudCheckRuleValidator(): ScheduledFraudCheckRuleValidator {
  return new ScheduledFraudCheckRuleValidator(
    [
      new ScheduledFraudCheckRuleNameLengthRule(86400),
      new ScheduledFraudCheckRuleCurrencyLengthRule(32),
      new ScheduledFraudCheckRuleAmountRangeRule(4.2, 410.6),
      new ScheduledFraudCheckRuleAllowedNameRule([]),
      new ScheduledFraudCheckRuleCodeLengthRule(64),
      new ScheduledFraudCheckRuleAudienceIdLengthRule(80),
    ],
  );
}
