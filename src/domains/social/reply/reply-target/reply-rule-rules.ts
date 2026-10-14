import { ReplyRule } from "./reply-rule.js";

/** A rule a reply rule must pass. Check returns its problems, or none. */
export interface ReplyRuleRule {
  check(item: ReplyRule): string[];
}

export class ReplyRuleCodeLengthRule implements ReplyRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyRuleCodePrefixRule implements ReplyRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyRuleRequiredCohortRule implements ReplyRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyRule): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply rule. */
export class ReplyRuleValidator {
  rules: ReplyRuleRule[];

  constructor(rules: ReplyRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyRule[]): Map<string, string[]> {
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

export function defaultReplyRuleValidator(): ReplyRuleValidator {
  return new ReplyRuleValidator(
    [
      new ReplyRuleCodeLengthRule(1000),
      new ReplyRuleCodePrefixRule("OPS"),
      new ReplyRuleRequiredCohortRule("reply rule needs this field"),
    ],
  );
}
