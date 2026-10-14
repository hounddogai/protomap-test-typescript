import { ExitRuleAudit } from "./exit-rule-audit.js";

/** A rule a exit rule audit must pass. Check returns its problems, or none. */
export interface ExitRuleAuditRule {
  check(item: ExitRuleAudit): string[];
}

export class ExitRuleAuditGraceDaysRangeRule implements ExitRuleAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleAudit): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleAuditCodeLengthRule implements ExitRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleAuditNameLengthRule implements ExitRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleAuditCodePrefixRule implements ExitRuleAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a exit rule audit. */
export class ExitRuleAuditValidator {
  rules: ExitRuleAuditRule[];

  constructor(rules: ExitRuleAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleAudit[]): Map<string, string[]> {
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

export function defaultExitRuleAuditValidator(): ExitRuleAuditValidator {
  return new ExitRuleAuditValidator(
    [
      new ExitRuleAuditGraceDaysRangeRule(120, 3600),
      new ExitRuleAuditCodeLengthRule(3600),
      new ExitRuleAuditNameLengthRule(80),
      new ExitRuleAuditCodePrefixRule("REF"),
    ],
  );
}
