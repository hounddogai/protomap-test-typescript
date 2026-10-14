import * as text from "../../../../kit/text.js";
import { ReplyAssignment } from "./reply-assignment.js";

/** A rule a reply assignment must pass. Check returns its problems, or none. */
export interface ReplyAssignmentRule {
  check(item: ReplyAssignment): string[];
}

export class ReplyAssignmentTitleLengthRule implements ReplyAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyAssignmentCodeLengthRule implements ReplyAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyAssignmentSendAtRangeRule implements ReplyAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyAssignment): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyAssignmentAudienceIdLengthRule implements ReplyAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAssignment): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyAssignmentRequiredCodeRule implements ReplyAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyAssignmentAllowedTitleRule implements ReplyAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

/** Runs every rule of a reply assignment. */
export class ReplyAssignmentValidator {
  rules: ReplyAssignmentRule[];

  constructor(rules: ReplyAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyAssignment[]): Map<string, string[]> {
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

export function defaultReplyAssignmentValidator(): ReplyAssignmentValidator {
  return new ReplyAssignmentValidator(
    [
      new ReplyAssignmentTitleLengthRule(80),
      new ReplyAssignmentCodeLengthRule(1000),
      new ReplyAssignmentSendAtRangeRule(120, 1000),
      new ReplyAssignmentAudienceIdLengthRule(1000),
      new ReplyAssignmentRequiredCodeRule("reply assignment needs a value"),
      new ReplyAssignmentAllowedTitleRule(["seasonal"]),
    ],
  );
}
