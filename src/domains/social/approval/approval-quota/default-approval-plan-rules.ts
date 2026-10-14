import { DefaultApprovalPlan } from "./default-approval-plan.js";

/** A rule a default approval plan must pass. Check returns its problems, or none. */
export interface DefaultApprovalPlanRule {
  check(item: DefaultApprovalPlan): string[];
}

export class DefaultApprovalPlanRequiredNameRule implements DefaultApprovalPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultApprovalPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultApprovalPlanCodePrefixRule implements DefaultApprovalPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultApprovalPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultApprovalPlanTimezoneLengthRule implements DefaultApprovalPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultApprovalPlan): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultApprovalPlanRequiredTimezoneRule implements DefaultApprovalPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultApprovalPlan): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default approval plan. */
export class DefaultApprovalPlanValidator {
  rules: DefaultApprovalPlanRule[];

  constructor(rules: DefaultApprovalPlanRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultApprovalPlan): string[] {
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

  requireValid(item: DefaultApprovalPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultApprovalPlan[]): Map<string, string[]> {
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

export function defaultDefaultApprovalPlanValidator(): DefaultApprovalPlanValidator {
  return new DefaultApprovalPlanValidator(
    [
      new DefaultApprovalPlanRequiredNameRule("default approval plan needs an entry"),
      new DefaultApprovalPlanCodePrefixRule("X"),
      new DefaultApprovalPlanTimezoneLengthRule(80),
      new DefaultApprovalPlanRequiredTimezoneRule("default approval plan needs this field"),
    ],
  );
}
