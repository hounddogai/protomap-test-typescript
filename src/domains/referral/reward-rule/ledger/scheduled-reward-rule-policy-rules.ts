import * as text from "../../../../kit/text.js";
import { ScheduledRewardRulePolicy } from "./scheduled-reward-rule-policy.js";

/** A rule a scheduled reward rule policy must pass. Check returns its problems, or none. */
export interface ScheduledRewardRulePolicyRule {
  check(item: ScheduledRewardRulePolicy): string[];
}

export class ScheduledRewardRulePolicyLocaleLengthRule implements ScheduledRewardRulePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRewardRulePolicy): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRewardRulePolicyRequiredCodeRule implements ScheduledRewardRulePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRewardRulePolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRewardRulePolicyLabelLengthRule implements ScheduledRewardRulePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRewardRulePolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRewardRulePolicyAllowedCodeRule implements ScheduledRewardRulePolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledRewardRulePolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class ScheduledRewardRulePolicyRequiredLocaleRule implements ScheduledRewardRulePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRewardRulePolicy): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled reward rule policy. */
export class ScheduledRewardRulePolicyValidator {
  rules: ScheduledRewardRulePolicyRule[];

  constructor(rules: ScheduledRewardRulePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRewardRulePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledRewardRulePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRewardRulePolicy[]): Map<string, string[]> {
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

export function defaultScheduledRewardRulePolicyValidator(): ScheduledRewardRulePolicyValidator {
  return new ScheduledRewardRulePolicyValidator(
    [
      new ScheduledRewardRulePolicyLocaleLengthRule(3600),
      new ScheduledRewardRulePolicyRequiredCodeRule("scheduled reward rule policy needs a value"),
      new ScheduledRewardRulePolicyLabelLengthRule(16),
      new ScheduledRewardRulePolicyAllowedCodeRule(["manual", "global", "default"]),
      new ScheduledRewardRulePolicyRequiredLocaleRule("scheduled reward rule policy needs a value"),
    ],
  );
}
