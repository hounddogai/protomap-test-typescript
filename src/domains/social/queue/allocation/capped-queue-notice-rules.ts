import * as text from "../../../../kit/text.js";
import { CappedQueueNotice } from "./capped-queue-notice.js";

/** A rule a capped queue notice must pass. Check returns its problems, or none. */
export interface CappedQueueNoticeRule {
  check(item: CappedQueueNotice): string[];
}

export class CappedQueueNoticeAllowedUtmSourceRule implements CappedQueueNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedQueueNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is missing`];
    return [];
  }
}

export class CappedQueueNoticeRequiredTimezoneRule implements CappedQueueNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedQueueNotice): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class CappedQueueNoticeAttemptsRangeRule implements CappedQueueNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedQueueNotice): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped queue notice. */
export class CappedQueueNoticeValidator {
  rules: CappedQueueNoticeRule[];

  constructor(rules: CappedQueueNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: CappedQueueNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedQueueNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedQueueNotice[]): Map<string, string[]> {
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

export function defaultCappedQueueNoticeValidator(): CappedQueueNoticeValidator {
  return new CappedQueueNoticeValidator(
    [
      new CappedQueueNoticeAllowedUtmSourceRule(["default", "weighted", "default"]),
      new CappedQueueNoticeRequiredTimezoneRule("capped queue notice needs an entry"),
      new CappedQueueNoticeAttemptsRangeRule(16, 64),
    ],
  );
}
