import * as text from "../../../../kit/text.js";
import { RewardRuleRequest } from "./reward-rule-request.js";

/** A rule a reward rule request must pass. Check returns its problems, or none. */
export interface RewardRuleRequestRule {
  check(item: RewardRuleRequest): string[];
}

export class RewardRuleRequestTitleLengthRule implements RewardRuleRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleRequestUtmSourceLengthRule implements RewardRuleRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleRequest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleRequestCodeLengthRule implements RewardRuleRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleRequestAllowedCodeRule implements RewardRuleRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class RewardRuleRequestLimitRangeRule implements RewardRuleRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleRequest): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward rule request. */
export class RewardRuleRequestValidator {
  rules: RewardRuleRequestRule[];

  constructor(rules: RewardRuleRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleRequest[]): Map<string, string[]> {
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

export function defaultRewardRuleRequestValidator(): RewardRuleRequestValidator {
  return new RewardRuleRequestValidator(
    [
      new RewardRuleRequestTitleLengthRule(3600),
      new RewardRuleRequestUtmSourceLengthRule(64),
      new RewardRuleRequestCodeLengthRule(80),
      new RewardRuleRequestAllowedCodeRule([]),
      new RewardRuleRequestLimitRangeRule(64, 120),
    ],
  );
}
