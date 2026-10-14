import { ReplyAdjustment } from "./reply-adjustment.js";

/** A rule a reply adjustment must pass. Check returns its problems, or none. */
export interface ReplyAdjustmentRule {
  check(item: ReplyAdjustment): string[];
}

export class ReplyAdjustmentTitleLengthRule implements ReplyAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyAdjustmentCodePrefixRule implements ReplyAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyAdjustmentRequiredTitleRule implements ReplyAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply adjustment. */
export class ReplyAdjustmentValidator {
  rules: ReplyAdjustmentRule[];

  constructor(rules: ReplyAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyAdjustment[]): Map<string, string[]> {
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

export function defaultReplyAdjustmentValidator(): ReplyAdjustmentValidator {
  return new ReplyAdjustmentValidator(
    [
      new ReplyAdjustmentTitleLengthRule(16),
      new ReplyAdjustmentCodePrefixRule("Q"),
      new ReplyAdjustmentRequiredTitleRule("reply adjustment needs an entry"),
    ],
  );
}
