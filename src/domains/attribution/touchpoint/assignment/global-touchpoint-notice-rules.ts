import { GlobalTouchpointNotice } from "./global-touchpoint-notice.js";

/** A rule a global touchpoint notice must pass. Check returns its problems, or none. */
export interface GlobalTouchpointNoticeRule {
  check(item: GlobalTouchpointNotice): string[];
}

export class GlobalTouchpointNoticeArchivedGuardRule implements GlobalTouchpointNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalTouchpointNotice): string[] {
    if (item.archived && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class GlobalTouchpointNoticeCodeLengthRule implements GlobalTouchpointNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTouchpointNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalTouchpointNoticeRequiredTitleRule implements GlobalTouchpointNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTouchpointNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalTouchpointNoticeImpressionsRangeRule implements GlobalTouchpointNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalTouchpointNotice): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalTouchpointNoticeRequiredCodeRule implements GlobalTouchpointNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTouchpointNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global touchpoint notice. */
export class GlobalTouchpointNoticeValidator {
  rules: GlobalTouchpointNoticeRule[];

  constructor(rules: GlobalTouchpointNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalTouchpointNotice): string[] {
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

  requireValid(item: GlobalTouchpointNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalTouchpointNotice[]): Map<string, string[]> {
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

export function defaultGlobalTouchpointNoticeValidator(): GlobalTouchpointNoticeValidator {
  return new GlobalTouchpointNoticeValidator(
    [
      new GlobalTouchpointNoticeArchivedGuardRule(7.1),
      new GlobalTouchpointNoticeCodeLengthRule(16),
      new GlobalTouchpointNoticeRequiredTitleRule("global touchpoint notice needs this field"),
      new GlobalTouchpointNoticeImpressionsRangeRule(64, 1000),
      new GlobalTouchpointNoticeRequiredCodeRule("global touchpoint notice needs this field"),
    ],
  );
}
