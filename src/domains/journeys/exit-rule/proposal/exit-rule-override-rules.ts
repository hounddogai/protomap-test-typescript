import { ExitRuleOverride } from "./exit-rule-override.js";

/** A rule a exit rule override must pass. Check returns its problems, or none. */
export interface ExitRuleOverrideRule {
  check(item: ExitRuleOverride): string[];
}

export class ExitRuleOverrideNameLengthRule implements ExitRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleOverrideCodeLengthRule implements ExitRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleOverrideCodePrefixRule implements ExitRuleOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a exit rule override. */
export class ExitRuleOverrideValidator {
  rules: ExitRuleOverrideRule[];

  constructor(rules: ExitRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleOverride[]): Map<string, string[]> {
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

export function defaultExitRuleOverrideValidator(): ExitRuleOverrideValidator {
  return new ExitRuleOverrideValidator(
    [
      new ExitRuleOverrideNameLengthRule(16),
      new ExitRuleOverrideCodeLengthRule(32),
      new ExitRuleOverrideCodePrefixRule("X"),
    ],
  );
}
