import { ReplyAllocation } from "./reply-allocation.js";

/** A rule a reply allocation must pass. Check returns its problems, or none. */
export interface ReplyAllocationRule {
  check(item: ReplyAllocation): string[];
}

export class ReplyAllocationRequiredSourceRule implements ReplyAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyAllocation): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyAllocationSendAtRangeRule implements ReplyAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyAllocation): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyAllocationReviewerLengthRule implements ReplyAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAllocation): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyAllocationRequiredLabelRule implements ReplyAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyAllocationCodeLengthRule implements ReplyAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply allocation. */
export class ReplyAllocationValidator {
  rules: ReplyAllocationRule[];

  constructor(rules: ReplyAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyAllocation[]): Map<string, string[]> {
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

export function defaultReplyAllocationValidator(): ReplyAllocationValidator {
  return new ReplyAllocationValidator(
    [
      new ReplyAllocationRequiredSourceRule("reply allocation needs this field"),
      new ReplyAllocationSendAtRangeRule(1000, 3600),
      new ReplyAllocationReviewerLengthRule(80),
      new ReplyAllocationRequiredLabelRule("reply allocation needs a value"),
      new ReplyAllocationCodeLengthRule(64),
    ],
  );
}
