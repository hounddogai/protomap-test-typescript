import { TouchpointNotice } from "./touchpoint-notice.js";

/** A rule a touchpoint notice must pass. Check returns its problems, or none. */
export interface TouchpointNoticeRule {
  check(item: TouchpointNotice): string[];
}

export class TouchpointNoticeCodeLengthRule implements TouchpointNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointNoticeBudgetRangeRule implements TouchpointNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointNotice): string[] {
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

export class TouchpointNoticeRequiredCategoryRule implements TouchpointNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointNotice): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint notice. */
export class TouchpointNoticeValidator {
  rules: TouchpointNoticeRule[];

  constructor(rules: TouchpointNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointNotice): string[] {
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

  requireValid(item: TouchpointNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointNotice[]): Map<string, string[]> {
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

export function defaultTouchpointNoticeValidator(): TouchpointNoticeValidator {
  return new TouchpointNoticeValidator(
    [
      new TouchpointNoticeCodeLengthRule(3600),
      new TouchpointNoticeBudgetRangeRule(6.5, 2795.9),
      new TouchpointNoticeRequiredCategoryRule("touchpoint notice needs an entry"),
    ],
  );
}
