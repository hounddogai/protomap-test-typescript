import * as text from "../../../../kit/text.js";
import { BidRuleSchedule } from "./bid-rule-schedule.js";

/** A rule a bid rule schedule must pass. Check returns its problems, or none. */
export interface BidRuleScheduleRule {
  check(item: BidRuleSchedule): string[];
}

export class BidRuleScheduleRequiredCodeRule implements BidRuleScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleScheduleTitleLengthRule implements BidRuleScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleScheduleRequiredTitleRule implements BidRuleScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleSchedule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleScheduleAllowedContactEmailRule implements BidRuleScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is blocked`];
    return [];
  }
}

/** Runs every rule of a bid rule schedule. */
export class BidRuleScheduleValidator {
  rules: BidRuleScheduleRule[];

  constructor(rules: BidRuleScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleSchedule[]): Map<string, string[]> {
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

export function defaultBidRuleScheduleValidator(): BidRuleScheduleValidator {
  return new BidRuleScheduleValidator(
    [
      new BidRuleScheduleRequiredCodeRule("bid rule schedule needs this field"),
      new BidRuleScheduleTitleLengthRule(16),
      new BidRuleScheduleRequiredTitleRule("bid rule schedule needs an entry"),
      new BidRuleScheduleAllowedContactEmailRule(["strict", "capped"]),
    ],
  );
}
