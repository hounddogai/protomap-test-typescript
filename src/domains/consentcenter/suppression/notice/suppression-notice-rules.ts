import { SuppressionNotice } from "./suppression-notice.js";

/** A rule a suppression notice must pass. Check returns its problems, or none. */
export interface SuppressionNoticeRule {
  check(item: SuppressionNotice): string[];
}

export class SuppressionNoticeRequiredNameRule implements SuppressionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionNoticeRequiredTitleRule implements SuppressionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionNoticeSourceLengthRule implements SuppressionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionNotice): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression notice. */
export class SuppressionNoticeValidator {
  rules: SuppressionNoticeRule[];

  constructor(rules: SuppressionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionNotice): string[] {
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

  requireValid(item: SuppressionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionNotice[]): Map<string, string[]> {
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

export function defaultSuppressionNoticeValidator(): SuppressionNoticeValidator {
  return new SuppressionNoticeValidator(
    [
      new SuppressionNoticeRequiredNameRule("suppression notice needs a value"),
      new SuppressionNoticeRequiredTitleRule("suppression notice needs this field"),
      new SuppressionNoticeSourceLengthRule(1000),
    ],
  );
}
