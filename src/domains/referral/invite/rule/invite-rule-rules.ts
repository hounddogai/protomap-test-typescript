import * as text from "../../../../kit/text.js";
import { InviteRule } from "./invite-rule.js";

/** A rule a invite rule must pass. Check returns its problems, or none. */
export interface InviteRuleRule {
  check(item: InviteRule): string[];
}

export class InviteRuleCodeLengthRule implements InviteRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteRuleAllowedCodeRule implements InviteRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class InviteRuleConversionRateRangeRule implements InviteRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteRule): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a invite rule. */
export class InviteRuleValidator {
  rules: InviteRuleRule[];

  constructor(rules: InviteRuleRule[]) {
    this.rules = rules;
  }

  validate(item: InviteRule): string[] {
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

  requireValid(item: InviteRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteRule[]): Map<string, string[]> {
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

export function defaultInviteRuleValidator(): InviteRuleValidator {
  return new InviteRuleValidator(
    [
      new InviteRuleCodeLengthRule(3600),
      new InviteRuleAllowedCodeRule(["lenient", "fallback", "lenient"]),
      new InviteRuleConversionRateRangeRule(4.1, 3800.8),
    ],
  );
}
