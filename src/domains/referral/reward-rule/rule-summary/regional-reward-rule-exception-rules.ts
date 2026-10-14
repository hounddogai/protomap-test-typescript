import * as text from "../../../../kit/text.js";
import { RegionalRewardRuleException } from "./regional-reward-rule-exception.js";

/** A rule a regional reward rule exception must pass. Check returns its problems, or none. */
export interface RegionalRewardRuleExceptionRule {
  check(item: RegionalRewardRuleException): string[];
}

export class RegionalRewardRuleExceptionCodePrefixRule implements RegionalRewardRuleExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalRewardRuleException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalRewardRuleExceptionContactEmailLengthRule implements RegionalRewardRuleExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRewardRuleException): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRewardRuleExceptionAllowedChannelRule implements RegionalRewardRuleExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalRewardRuleException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is expired`];
    return [];
  }
}

export class RegionalRewardRuleExceptionRequiredContactEmailRule implements RegionalRewardRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRewardRuleException): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional reward rule exception. */
export class RegionalRewardRuleExceptionValidator {
  rules: RegionalRewardRuleExceptionRule[];

  constructor(rules: RegionalRewardRuleExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalRewardRuleException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalRewardRuleException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalRewardRuleException[]): Map<string, string[]> {
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

export function defaultRegionalRewardRuleExceptionValidator(): RegionalRewardRuleExceptionValidator {
  return new RegionalRewardRuleExceptionValidator(
    [
      new RegionalRewardRuleExceptionCodePrefixRule("Q"),
      new RegionalRewardRuleExceptionContactEmailLengthRule(255),
      new RegionalRewardRuleExceptionAllowedChannelRule(["lenient"]),
      new RegionalRewardRuleExceptionRequiredContactEmailRule("regional reward rule exception needs an entry"),
    ],
  );
}
