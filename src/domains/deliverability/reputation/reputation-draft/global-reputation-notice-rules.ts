import * as text from "../../../../kit/text.js";
import { GlobalReputationNotice } from "./global-reputation-notice.js";

/** A rule a global reputation notice must pass. Check returns its problems, or none. */
export interface GlobalReputationNoticeRule {
  check(item: GlobalReputationNotice): string[];
}

export class GlobalReputationNoticeRateRangeRule implements GlobalReputationNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalReputationNotice): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalReputationNoticeAllowedTitleRule implements GlobalReputationNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalReputationNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is inconsistent`];
    return [];
  }
}

export class GlobalReputationNoticeRequiredCodeRule implements GlobalReputationNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalReputationNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalReputationNoticeTitleLengthRule implements GlobalReputationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalReputationNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global reputation notice. */
export class GlobalReputationNoticeValidator {
  rules: GlobalReputationNoticeRule[];

  constructor(rules: GlobalReputationNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalReputationNotice): string[] {
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

  requireValid(item: GlobalReputationNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalReputationNotice[]): Map<string, string[]> {
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

export function defaultGlobalReputationNoticeValidator(): GlobalReputationNoticeValidator {
  return new GlobalReputationNoticeValidator(
    [
      new GlobalReputationNoticeRateRangeRule(2.8, 1307.9),
      new GlobalReputationNoticeAllowedTitleRule(["scheduled", "seasonal", "rolling"]),
      new GlobalReputationNoticeRequiredCodeRule("global reputation notice needs an entry"),
      new GlobalReputationNoticeTitleLengthRule(86400),
    ],
  );
}
