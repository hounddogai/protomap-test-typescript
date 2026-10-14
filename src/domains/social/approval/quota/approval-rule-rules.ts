import { ApprovalRule } from "./approval-rule.js";

/** A rule a approval rule must pass. Check returns its problems, or none. */
export interface ApprovalRuleRule {
  check(item: ApprovalRule): string[];
}

export class ApprovalRuleRequiredTitleRule implements ApprovalRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalRuleRequiredCodeRule implements ApprovalRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalRuleRevisionRangeRule implements ApprovalRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalRule): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalRuleDurationMinutesRangeRule implements ApprovalRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalRule): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalRuleCodePrefixRule implements ApprovalRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a approval rule. */
export class ApprovalRuleValidator {
  rules: ApprovalRuleRule[];

  constructor(rules: ApprovalRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalRule[]): Map<string, string[]> {
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

export function defaultApprovalRuleValidator(): ApprovalRuleValidator {
  return new ApprovalRuleValidator(
    [
      new ApprovalRuleRequiredTitleRule("approval rule needs this field"),
      new ApprovalRuleRequiredCodeRule("approval rule needs this field"),
      new ApprovalRuleRevisionRangeRule(16, 1000),
      new ApprovalRuleDurationMinutesRangeRule(64, 64),
      new ApprovalRuleCodePrefixRule("X"),
    ],
  );
}
