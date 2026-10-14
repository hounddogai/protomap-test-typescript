import * as text from "../../../../kit/text.js";
import { ExitRuleAssignment } from "./exit-rule-assignment.js";

/** A rule a exit rule assignment must pass. Check returns its problems, or none. */
export interface ExitRuleAssignmentRule {
  check(item: ExitRuleAssignment): string[];
}

export class ExitRuleAssignmentAllowedCodeRule implements ExitRuleAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class ExitRuleAssignmentCodeLengthRule implements ExitRuleAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleAssignmentMinimumRangeRule implements ExitRuleAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleAssignment): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleAssignmentRequiredCodeRule implements ExitRuleAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleAssignmentCodePrefixRule implements ExitRuleAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a exit rule assignment. */
export class ExitRuleAssignmentValidator {
  rules: ExitRuleAssignmentRule[];

  constructor(rules: ExitRuleAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleAssignment[]): Map<string, string[]> {
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

export function defaultExitRuleAssignmentValidator(): ExitRuleAssignmentValidator {
  return new ExitRuleAssignmentValidator(
    [
      new ExitRuleAssignmentAllowedCodeRule([]),
      new ExitRuleAssignmentCodeLengthRule(86400),
      new ExitRuleAssignmentMinimumRangeRule(0, 2141.7),
      new ExitRuleAssignmentRequiredCodeRule("exit rule assignment needs an entry"),
      new ExitRuleAssignmentCodePrefixRule("X"),
    ],
  );
}
