import { StrictReplyClaim } from "./strict-reply-claim.js";

/** A rule a strict reply claim must pass. Check returns its problems, or none. */
export interface StrictReplyClaimRule {
  check(item: StrictReplyClaim): string[];
}

export class StrictReplyClaimRequiredTitleRule implements StrictReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReplyClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReplyClaimRequiredOwnerIdRule implements StrictReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReplyClaim): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReplyClaimBudgetRangeRule implements StrictReplyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReplyClaim): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictReplyClaimCodeLengthRule implements StrictReplyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReplyClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict reply claim. */
export class StrictReplyClaimValidator {
  rules: StrictReplyClaimRule[];

  constructor(rules: StrictReplyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReplyClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictReplyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReplyClaim[]): Map<string, string[]> {
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

export function defaultStrictReplyClaimValidator(): StrictReplyClaimValidator {
  return new StrictReplyClaimValidator(
    [
      new StrictReplyClaimRequiredTitleRule("strict reply claim needs an entry"),
      new StrictReplyClaimRequiredOwnerIdRule("strict reply claim needs an entry"),
      new StrictReplyClaimBudgetRangeRule(3.5, 504.7),
      new StrictReplyClaimCodeLengthRule(120),
    ],
  );
}
