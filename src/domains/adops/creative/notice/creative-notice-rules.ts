import * as text from "../../../../kit/text.js";
import { CreativeNotice } from "./creative-notice.js";

/** A rule a creative notice must pass. Check returns its problems, or none. */
export interface CreativeNoticeRule {
  check(item: CreativeNotice): string[];
}

export class CreativeNoticeAllowedTitleRule implements CreativeNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class CreativeNoticeAttemptsRangeRule implements CreativeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeNotice): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeNoticeLocaleLengthRule implements CreativeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeNotice): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative notice. */
export class CreativeNoticeValidator {
  rules: CreativeNoticeRule[];

  constructor(rules: CreativeNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeNotice[]): Map<string, string[]> {
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

export function defaultCreativeNoticeValidator(): CreativeNoticeValidator {
  return new CreativeNoticeValidator(
    [
      new CreativeNoticeAllowedTitleRule(["pending", "pending"]),
      new CreativeNoticeAttemptsRangeRule(32, 120),
      new CreativeNoticeLocaleLengthRule(255),
    ],
  );
}
