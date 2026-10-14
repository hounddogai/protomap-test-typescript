import { ReplyPlan } from "./reply-plan.js";

/** A rule a reply plan must pass. Check returns its problems, or none. */
export interface ReplyPlanRule {
  check(item: ReplyPlan): string[];
}

export class ReplyPlanRequiredCodeRule implements ReplyPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyPlanCodePrefixRule implements ReplyPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyPlanCodeLengthRule implements ReplyPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyPlanGraceDaysRangeRule implements ReplyPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyPlan): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyPlanRequiredCategoryRule implements ReplyPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyPlan): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply plan. */
export class ReplyPlanValidator {
  rules: ReplyPlanRule[];

  constructor(rules: ReplyPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyPlan[]): Map<string, string[]> {
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

export function defaultReplyPlanValidator(): ReplyPlanValidator {
  return new ReplyPlanValidator(
    [
      new ReplyPlanRequiredCodeRule("reply plan needs a value"),
      new ReplyPlanCodePrefixRule("ACM"),
      new ReplyPlanCodeLengthRule(32),
      new ReplyPlanGraceDaysRangeRule(255, 86400),
      new ReplyPlanRequiredCategoryRule("reply plan needs this field"),
    ],
  );
}
