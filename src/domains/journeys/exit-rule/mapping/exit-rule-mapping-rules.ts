import * as text from "../../../../kit/text.js";
import { ExitRuleMapping } from "./exit-rule-mapping.js";

/** A rule a exit rule mapping must pass. Check returns its problems, or none. */
export interface ExitRuleMappingRule {
  check(item: ExitRuleMapping): string[];
}

export class ExitRuleMappingRequiredCodeRule implements ExitRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleMappingRequiredTitleRule implements ExitRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleMappingPhoneLengthRule implements ExitRuleMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleMapping): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleMappingAllowedContactEmailRule implements ExitRuleMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is above maximum`];
    return [];
  }
}

/** Runs every rule of a exit rule mapping. */
export class ExitRuleMappingValidator {
  rules: ExitRuleMappingRule[];

  constructor(rules: ExitRuleMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleMapping): string[] {
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

  requireValid(item: ExitRuleMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleMapping[]): Map<string, string[]> {
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

export function defaultExitRuleMappingValidator(): ExitRuleMappingValidator {
  return new ExitRuleMappingValidator(
    [
      new ExitRuleMappingRequiredCodeRule("exit rule mapping needs this field"),
      new ExitRuleMappingRequiredTitleRule("exit rule mapping needs an entry"),
      new ExitRuleMappingPhoneLengthRule(80),
      new ExitRuleMappingAllowedContactEmailRule(["fallback", "regional", "primary"]),
    ],
  );
}
