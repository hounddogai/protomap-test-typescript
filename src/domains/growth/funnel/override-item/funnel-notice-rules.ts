import { FunnelNotice } from "./funnel-notice.js";

/** A rule a funnel notice must pass. Check returns its problems, or none. */
export interface FunnelNoticeRule {
  check(item: FunnelNotice): string[];
}

export class FunnelNoticeRequiredCodeRule implements FunnelNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelNoticeActiveGuardRule implements FunnelNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FunnelNotice): string[] {
    if (item.active && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while active`];
    return [];
  }
}

export class FunnelNoticeNotesLengthRule implements FunnelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelNotice): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel notice. */
export class FunnelNoticeValidator {
  rules: FunnelNoticeRule[];

  constructor(rules: FunnelNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelNotice): string[] {
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

  requireValid(item: FunnelNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelNotice[]): Map<string, string[]> {
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

export function defaultFunnelNoticeValidator(): FunnelNoticeValidator {
  return new FunnelNoticeValidator(
    [
      new FunnelNoticeRequiredCodeRule("funnel notice needs a value"),
      new FunnelNoticeActiveGuardRule(8.3),
      new FunnelNoticeNotesLengthRule(1000),
    ],
  );
}
