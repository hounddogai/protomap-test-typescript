import { FrequencyNotice } from "./frequency-notice.js";

/** A rule a frequency notice must pass. Check returns its problems, or none. */
export interface FrequencyNoticeRule {
  check(item: FrequencyNotice): string[];
}

export class FrequencyNoticeCodeLengthRule implements FrequencyNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyNoticeCodePrefixRule implements FrequencyNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyNoticeBudgetRangeRule implements FrequencyNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyNotice): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a frequency notice. */
export class FrequencyNoticeValidator {
  rules: FrequencyNoticeRule[];

  constructor(rules: FrequencyNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyNotice[]): Map<string, string[]> {
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

export function defaultFrequencyNoticeValidator(): FrequencyNoticeValidator {
  return new FrequencyNoticeValidator(
    [
      new FrequencyNoticeCodeLengthRule(120),
      new FrequencyNoticeCodePrefixRule("ACM"),
      new FrequencyNoticeBudgetRangeRule(8, 1203.8),
    ],
  );
}
