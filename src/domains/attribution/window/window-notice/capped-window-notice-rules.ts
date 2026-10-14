import { CappedWindowNotice } from "./capped-window-notice.js";

/** A rule a capped window notice must pass. Check returns its problems, or none. */
export interface CappedWindowNoticeRule {
  check(item: CappedWindowNotice): string[];
}

export class CappedWindowNoticeRequiredCategoryRule implements CappedWindowNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWindowNotice): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class CappedWindowNoticeRequiredCodeRule implements CappedWindowNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedWindowNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedWindowNoticeCategoryLengthRule implements CappedWindowNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWindowNotice): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped window notice. */
export class CappedWindowNoticeValidator {
  rules: CappedWindowNoticeRule[];

  constructor(rules: CappedWindowNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWindowNotice): string[] {
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

  requireValid(item: CappedWindowNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWindowNotice[]): Map<string, string[]> {
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

export function defaultCappedWindowNoticeValidator(): CappedWindowNoticeValidator {
  return new CappedWindowNoticeValidator(
    [
      new CappedWindowNoticeRequiredCategoryRule("capped window notice needs a value"),
      new CappedWindowNoticeRequiredCodeRule("capped window notice needs this field"),
      new CappedWindowNoticeCategoryLengthRule(80),
    ],
  );
}
