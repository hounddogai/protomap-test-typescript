import { LenientModelNotice } from "./lenient-model-notice.js";

/** A rule a lenient model notice must pass. Check returns its problems, or none. */
export interface LenientModelNoticeRule {
  check(item: LenientModelNotice): string[];
}

export class LenientModelNoticeCostRangeRule implements LenientModelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientModelNotice): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientModelNoticeRequiredLabelRule implements LenientModelNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientModelNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientModelNoticeCodeLengthRule implements LenientModelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientModelNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient model notice. */
export class LenientModelNoticeValidator {
  rules: LenientModelNoticeRule[];

  constructor(rules: LenientModelNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LenientModelNotice): string[] {
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

  requireValid(item: LenientModelNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientModelNotice[]): Map<string, string[]> {
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

export function defaultLenientModelNoticeValidator(): LenientModelNoticeValidator {
  return new LenientModelNoticeValidator(
    [
      new LenientModelNoticeCostRangeRule(3, 4599.4),
      new LenientModelNoticeRequiredLabelRule("lenient model notice needs an entry"),
      new LenientModelNoticeCodeLengthRule(32),
    ],
  );
}
