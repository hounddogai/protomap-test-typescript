import * as text from "../../../../kit/text.js";
import { PacingNotice } from "./pacing-notice.js";

/** A rule a pacing notice must pass. Check returns its problems, or none. */
export interface PacingNoticeRule {
  check(item: PacingNotice): string[];
}

export class PacingNoticeCodeLengthRule implements PacingNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingNoticeFrequencyCapRangeRule implements PacingNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingNotice): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingNoticeAllowedNameRule implements PacingNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

/** Runs every rule of a pacing notice. */
export class PacingNoticeValidator {
  rules: PacingNoticeRule[];

  constructor(rules: PacingNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PacingNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingNotice[]): Map<string, string[]> {
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

export function defaultPacingNoticeValidator(): PacingNoticeValidator {
  return new PacingNoticeValidator(
    [
      new PacingNoticeCodeLengthRule(80),
      new PacingNoticeFrequencyCapRangeRule(120, 86400),
      new PacingNoticeAllowedNameRule(["weighted"]),
    ],
  );
}
