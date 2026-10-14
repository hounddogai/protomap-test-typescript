import * as text from "../../../../kit/text.js";
import { ReplyTarget } from "./reply-target.js";

/** A rule a reply target must pass. Check returns its problems, or none. */
export interface ReplyTargetRule {
  check(item: ReplyTarget): string[];
}

export class ReplyTargetTitleLengthRule implements ReplyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyTargetAllowedVariantRule implements ReplyTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is expired`];
    return [];
  }
}

export class ReplyTargetRequiredCodeRule implements ReplyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply target. */
export class ReplyTargetValidator {
  rules: ReplyTargetRule[];

  constructor(rules: ReplyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyTarget[]): Map<string, string[]> {
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

export function defaultReplyTargetValidator(): ReplyTargetValidator {
  return new ReplyTargetValidator(
    [
      new ReplyTargetTitleLengthRule(80),
      new ReplyTargetAllowedVariantRule(["weighted", "legacy", "legacy"]),
      new ReplyTargetRequiredCodeRule("reply target needs this field"),
    ],
  );
}
